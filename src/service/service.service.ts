import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RailwayClientService } from 'src/railway-client/railway-client.service';
import { GQL_CREATE_RAILWAY_PROJECT_SERVICE_MUTATION, GQL_DELETE_RAILWAY_SERVICE_MUTATION } from './gql';
import { CreateNewRailwayProjectServiceDTO } from './dto/service.input';
import type { AuthUser } from 'src/@types/auth';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class ServiceService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly railwayClientService: RailwayClientService,
  ) { }

  /**
   * Method for creating new railway projects
   *
   * @param {AuthUser} user
   * @param {string} id
   *
   * @return {boolean|void}
   */
  async deleteRailwayService(user: AuthUser, id: string) {
    try {
      const service = await this.prismaService.service.findFirstOrThrow({
        where: { id, userId: user.userId },
        include: {
          project: {
            include: {
              token: true,
            }
          },
        }
      });

      if (service.project?.token?.value) {
        const { data } = await this.railwayClientService.client.mutate({
          mutation: GQL_DELETE_RAILWAY_SERVICE_MUTATION,
          variables: { id: service.railwayServiceId },
          context: {
            headers: {
              Authorization: 'Bearer ' + service.project.token.value,
            },
          },
        });
        if (!data.serviceDelete) throw new Error();
      }

      await this.prismaService.service.delete({ where: { id } })
      return true;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new NotFoundException("SERVICE_NOT_FOUND")
      }

      return false;
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
  async createNewRailwayProjectService(
    user: AuthUser,
    { tokenId, variables, ...payload }: CreateNewRailwayProjectServiceDTO,
  ) {
    const project = await this.prismaService.project.findFirstOrThrow({ where: { id: payload.projectId, userId: user.userId }, include: { token: true } });
    const token = project.token.value || tokenId

    const envVariables: Record<string, string> = {}
    variables.filter(({ key }) => Boolean(key)).forEach((variable) => {
      const key = variable.key;
      const value = variable.value;
      envVariables[key] = value;
    });

    const input = {
      ...payload,
      projectId: project.railwayProjectId,
      variables: Object.keys(envVariables).length > 0 ? envVariables : undefined,
    };

    const { data } = await this.railwayClientService.client.mutate({
      mutation: GQL_CREATE_RAILWAY_PROJECT_SERVICE_MUTATION,
      variables: {
        input,
      },
      context: {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      },
    });

    const newService = data.serviceCreate;

    return await this.prismaService.$transaction(async (prisma) => {
      const createdService = await prisma.service.create({
        data: {
          railwayServiceId: newService.id,
          projectId: project.id,
          name: newService.name,
          userId: user.userId,
          serviceCreatedAt: newService.createdAt,
          serviceUpdatedAt: newService.updatedAt,
        }
      });

      const instances = newService.serviceInstances?.edges?.map(
        (instance) => {
          const payload = {
            serviceId: createdService.id,
            userId: user.userId,
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

      return createdService;
    })
  }
}
