import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { GQL_USER_GITHUB_REPOSITORIES_QUERY } from './gql';
import { User } from 'src/models';
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

  @Process('LOAD_GITHUB_REPOSITORIES')
  async loadGithubRepositories(
    job: Job<{
      token: string;
      user: User;
    }>,
  ): Promise<void> {
    const token = job.data.token;
    const user = job.data.user;

    const { data } = await this.railwayClientService.client.query({
      query: GQL_USER_GITHUB_REPOSITORIES_QUERY,
      context: {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      },
    });

    await this.prismaService.$transaction(async (prisma) => {
      const repos = data.githubRepos?.map((repo) => ({
        defaultBranch: repo.defaultBranch,
        fullName: repo.fullName,
        installationId: repo.installationId,
        isPrivate: repo.isPrivate,
        name: repo.name,
        userId: user.id,
        repoId: repo.id,
      }));

      await prisma.userRepository.createMany({
        data: repos,
      });
    });
  }

  @Process('LOAD_PROJECTS_AND_SERVICES')
  async loadProjectsAndServices(
    job: Job<{
      railwayId: string;
      user: User;
      projects: any[];
    }>,
  ): Promise<void> {
    const projects = job.data.projects;
    const user = job.data.user;
    const railwayId = job.data.railwayId;

    await this.prismaService.$transaction(async (prisma) => {
      // User profile
      const profile = await prisma.profile.findFirstOrThrow({
        where: { railwayId: railwayId, userId: user.id },
      });

      // Create or update projects
      for (let i = 0; i < projects.length; i++) {
        const project = projects[i];

        const payload = {
          name: project.node.name,
          railwayProjectId: project.node.id,
          userId: user.id,
          profileId: profile.id,
          description: project.node.description,
          projectCreatedAt: project.node.createdAt,
          projectUpdatedAt: project.node.updatedAt,
          prDeploys: project.node.prDeploys,
          prForks: project.node.prForks,
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
