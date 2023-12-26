import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ApolloError } from '@apollo/client/core';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CreateNewRailwayProjectDTO } from './dto/project.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { RailwayClientService } from 'src/railway-client/railway-client.service';
import {
  GQL_CREATE_RAILWAY_PROJECT_MUTATION,
  GQL_DELETE_RAILWAY_PROJECT_MUTATION,
} from './gql';
import { GQL_GET_RAILWAY_PROJECT_DEPLOYMENTS_QUERY } from './gql/query';
import { CacheService } from 'src/cache/cache.service';
import type { AuthUser } from 'src/@types/auth';

@Injectable()
export class ProjectService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cacheService: CacheService,
    private readonly railwayClientService: RailwayClientService,
  ) {}

  /**
   * Method for removing railway projects
   *
   * @param {AuthUser} user
   * @param {string} projectId
   *
   * @return {Project}
   */
  async deleteRailwayProject(user: AuthUser, projectId: string) {
    try {
      const project = await this.prismaService.project.findFirstOrThrow({
        where: { id: projectId, userId: user.userId },
        include: {
          token: true,
          services: {
            include: {
              instances: true,
            },
          },
        },
      });

      if (project.token) {
        const { data } = await this.railwayClientService.client.mutate({
          mutation: GQL_DELETE_RAILWAY_PROJECT_MUTATION,
          variables: { id: project.railwayProjectId },
          context: {
            headers: {
              Authorization: 'Bearer ' + project.token.value,
            },
          },
        });
        if (!data.projectDelete) throw new Error();
      }

      await this.prismaService.project.delete({ where: { id: project.id } });
      return true;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new NotFoundException('PROJECT_NOT_FOUND');
      }

      return false;
    }
  }

  /**
   * Method for retrieving railway projects deployments
   *
   * @param {AuthUser} user
   * @param {string} projectId
   *
   * @return {any}
   */
  async getRailwayProjectDeployments(user: AuthUser, projectId: string) {
    try {
      const key = `PROJECT-DEPLOYMENTS-${projectId}`.toLowerCase().replaceAll('/', '-');
      const project = await this.prismaService.project.findFirstOrThrow({
        where: { id: projectId },
        include: {
          token: true,
        }
      });

      const cachedData = await this.cacheService.get<string | null>(key);
      if (cachedData) {
        return JSON.parse(String(cachedData));
      }

      let { data } = await this.railwayClientService.client.query({
        query: GQL_GET_RAILWAY_PROJECT_DEPLOYMENTS_QUERY,
        variables: { input: { projectId: project.railwayProjectId } },
        context: {
          headers: {
            Authorization: 'Bearer ' + project.token.value,
          },
        },
      });

      data = JSON.stringify(data?.deployments || []);
      await this.cacheService.set(key, JSON.stringify(data), 600);

      return data;
    } catch (error) {
      if (error instanceof ApolloError) {
        throw new BadRequestException('Request could not be processed at this time.');
      }
      if (error instanceof PrismaClientKnownRequestError) {
        throw new NotFoundException('PROJECT_NOT_FOUND');
      }

      throw new InternalServerErrorException();
    }
  }

  /**
   * Method for retrieving railway projects
   *
   * @param {AuthUser} user
   * @param {string} projectId
   *
   * @return {Project}
   */
  async getRailwayProject(user: AuthUser, projectId: string) {
    try {
      const project = await this.prismaService.project.findFirstOrThrow({
        where: { id: projectId },
        include: {
          services: {
            include: {
              instances: true,
            },
          },
        },
      });

      return project;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new NotFoundException('PROJECT_NOT_FOUND');
      }
      throw new InternalServerErrorException();
    }
  }

  /**
   * Method for creating new railway projects
   *
   * @param {AuthUser} user
   * @param {CreateNewRailwayProjectDTO} payload
   *
   * @return {any}
   */
  async createNewRailwayProject(
    { userId }: AuthUser,
    { tokenId, ...payload }: CreateNewRailwayProjectDTO,
  ) {
    try {
      const user = await this.prismaService.user.findFirstOrThrow({
        where: { id: userId },

        include: {
          defaultRailwayToken: true,
        },
      });

      const tokenIdToBeUsed = tokenId || user.defaultRailwayTokenId;

      if (!tokenIdToBeUsed) {
        throw new Error('Invalid Railway token selected.');
      }

      const token = await this.prismaService.token.findFirstOrThrow({
        where: { userId, id: tokenIdToBeUsed },
      });

      const { data } = await this.railwayClientService.client.mutate({
        mutation: GQL_CREATE_RAILWAY_PROJECT_MUTATION,
        variables: { input: payload },
        context: {
          headers: {
            Authorization: 'Bearer ' + token.value,
          },
        },
      });

      return await this.prismaService.$transaction(async (prisma) => {
        const record = data.projectCreate;

        const project = await prisma.project.create({
          data: {
            userId: user.id,
            railwayProjectId: record.id,
            name: record.name,
            description: record.description,
            projectCreatedAt: record.createdAt,
            projectUpdatedAt: record.updatedAt,
            prDeploys: record.prDeploys,
            prForks: record.prForks,
          },
        });

        const projectServices = record.services?.edges;

        if (projectServices.length > 0) {
          for (let j = 0; j < projectServices.length; j++) {
            const service = projectServices[j];

            // Create service record
            const payload = {
              projectId: project.id,
              railwayServiceId: service.node.id,
              name: service.node.name,
              icon: service.node.icon,
              userId: user.id,
              serviceCreatedAt: service.node.createdAt,
              serviceUpdatedAt: service.node.updatedAt,
            };

            const newlyCreatedService = await prisma.service.upsert({
              create: payload,
              update: payload,
              where: { railwayServiceId: service.node.id },
            });

            const instances = service.node.serviceInstances?.edges?.map(
              (instance) => {
                const payload = {
                  serviceId: newlyCreatedService.id,
                  userId: user.id,
                  railwayServiceInstanceId: instance.node.id,
                  buildCommand: instance.node.buildCommand,
                  sourceImage: instance.node.source?.image,
                  sourceRepo: instance.node.source?.repo,
                  sourceTemplateName:
                    instance.node.source?.template?.serviceName,
                  sourceTemplateSource:
                    instance.node.source?.template?.serviceSource,
                  startCommand: instance.node.startCommand,
                  numReplicas: instance.node.numReplicas,
                  domains: instance.node.domains,
                };

                return prisma.serviceInstance.upsert({
                  where: { railwayServiceInstanceId: instance.node.id },
                  create: payload,
                  update: payload,
                });
              },
            );

            await Promise.all(instances);
          }
        }

        return project;
      });
    } catch (error) {
      if (error instanceof ApolloError) {
        throw new BadRequestException(
          'Error encountered while creating project on Railway.',
        );
      }

      throw error;
    }
  }
}
