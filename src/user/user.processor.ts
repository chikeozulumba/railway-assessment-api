import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { Token, User } from 'src/models';
import { PrismaService } from 'src/prisma/prisma.service';
import { RailwayClientService } from 'src/railway-client/railway-client.service';

@Injectable()
@Processor('QUEUE_USER')
export class UserProcessor {
  private readonly logger = new Logger(UserProcessor.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly railwayClientService: RailwayClientService,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onComplete(job: Job) {
    this.logger.debug(`Completed job ${job.id} of type ${job.name}`);
  }

  @OnQueueFailed()
  onError(job: Job<any>, error: any) {
    this.logger.error(
      `Failed job ${job.id} of type ${job.name}: ${error.message}`,
      error.stack,
    );
  }

  @Process('REMOVE_REPO_AND_PROJECTS_AND_SERVICES')
  async removeReposProjectsAndServices(
    job: Job<{
      tokenId: string;
    }>,
  ): Promise<void> {
    const tokenId = job.data.tokenId;
    await this.prismaService.project.deleteMany({ where: { tokenId } });
  }

  @Process('LOAD_PROJECTS_AND_SERVICES')
  async loadProjectsAndServices(
    job: Job<{
      railwayId: string;
      user: User;
      token: Token;
      projects: any[];
    }>,
  ): Promise<void> {
    const projects = job.data.projects;
    const user = job.data.user;
    const token = job.data.token;

    await this.prismaService.$transaction(async (prisma) => {
      // User profile

      // Create or update projects
      for (let i = 0; i < projects.length; i++) {
        const project = projects[i];

        const payload = {
          name: project.node.name,
          railwayProjectId: project.node.id,
          userId: user.id,
          description: project.node.description,
          projectCreatedAt: project.node.createdAt,
          projectUpdatedAt: project.node.updatedAt,
          prDeploys: project.node.prDeploys,
          prForks: project.node.prForks,
          tokenId: token.id,
        };

        const newProject = await prisma.project.upsert({
          where: { railwayProjectId: project.node.id },
          create: payload,
          update: payload,
        });

        const projectServices = project.node.services?.edges;

        if (projectServices.length > 0) {
          for (let j = 0; j < projectServices.length; j++) {
            const service = projectServices[j];

            // Create service record
            const payload = {
              projectId: newProject.id,
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
      }
    });
  }
}
