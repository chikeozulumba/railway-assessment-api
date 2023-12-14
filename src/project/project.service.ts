import { BadRequestException, Injectable } from '@nestjs/common';
import { ApolloError } from '@apollo/client/core';
import { CreateNewRailwayProjectDTO } from './dto/project.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { RailwayClientService } from 'src/railway-client/railway-client.service';
import { GQL_CREATE_RAILWAY_PROJECT_MUTATION } from './gql';
import type { AuthUser } from 'src/@types/auth';
import { Project } from 'src/models';

@Injectable()
export class ProjectService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly railwayClientService: RailwayClientService,
  ) { }
  /**
   * Method for creating new railway projects
   *
   * @param {AuthUser} user
   * @param {CreateNewRailwayProjectDTO} payload
   *
   * @return {any}
   */
  async createNewRailwayProject(
    { sub: uid }: AuthUser,
    { tokenId, ...payload }: CreateNewRailwayProjectDTO,
  ) {
    try {
      const user = await this.prismaService.user.findFirstOrThrow({
        where: { uid },
        include: {
          tokens: true,
        },
      });

      const defaultActiveToken = user.activeRailwayToken;
      console.log(defaultActiveToken || tokenId, user.tokens, user);

      if (!defaultActiveToken && !tokenId) {
        throw new BadRequestException(`Invalid Railway token provided.`);
      }

      const token = user.tokens.find(
        (token) => token.id === (tokenId || defaultActiveToken),
      );

      if (!token) {
        throw new BadRequestException(`Invalid Railway token provided.`);
      }

      const { data } = await this.railwayClientService.client.mutate({
        mutation: GQL_CREATE_RAILWAY_PROJECT_MUTATION,
        variables: { payload: { ...payload } },
        context: {
          headers: {
            Authorization: 'Bearer ' + token.value,
          },
        },
      });

      return await this.prismaService.$transaction(async (prisma) => {

        const record = data.projectCreate;

        const project = await this.prismaService.project.create({
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
        console.log(JSON.stringify(error));
        throw new BadRequestException(
          'Error encountered while creating project on Railway.',
        );
      }

      throw error;
    }
  }
}
