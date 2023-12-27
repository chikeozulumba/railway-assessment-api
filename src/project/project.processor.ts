import {
  InjectQueue,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { Queue } from 'bull';
import { Token } from 'src/models';
import { RailwayClientService } from 'src/railway-client/railway-client.service';
import { GQL_GET_RAILWAY_PROJECT_QUERY } from './gql/query';
import { AuthUser } from 'src/@types/auth';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
@Processor('QUEUE_PROJECT')
export class ProjectProcessor {
  private readonly logger = new Logger(ProjectProcessor.name);

  constructor(
    @InjectQueue('QUEUE_USER')
    private readonly userQueue: Queue,
    private readonly prismaService: PrismaService,
    private readonly railwayClientService: RailwayClientService,
  ) { }

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

  @Process('LOAD_PROJECT_AND_SERVICES_BY_PROJECT_ID')
  async loadProjectAndServicesByID(
    job: Job<{
      projectId: string;
      user: AuthUser;
      token: Token;
      projects: any[];
    }>,
  ): Promise<void> {
    const projectId = job.data.projectId;
    const authUser = job.data.user;
    const token = job.data.token;

    // Fetch profile from Railway
    const { data } =
      await this.railwayClientService.client.query({
        query: GQL_GET_RAILWAY_PROJECT_QUERY,
        variables: { id: projectId },
        context: {
          headers: {
            Authorization: 'Bearer ' + token.value,
          },
        },
      });

    if (!data || !data?.project) {
      throw new Error('Could not retrieve project with ID')
    }

    const user = await this.prismaService.user.findFirstOrThrow({ where: { id: authUser.userId } });

    await this.userQueue.add('LOAD_PROJECTS_AND_SERVICES', {
      user,
      projects: [data?.project],
      token,
    });
  }
}
