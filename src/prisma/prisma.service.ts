import {
  INestApplication,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ConfigService } from 'src/config/config.service';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, Prisma.LogLevel>
  implements OnModuleInit
{
  private configService = new ConfigService();
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });

    if (['local', 'development'].includes(this.configService.get('NODE_ENV'))) {
      this.$on('error', ({ message }) => {
        this.logger.error(message);
      });
      this.$on('warn', ({ message }) => {
        this.logger.warn(message);
      });
      this.$on('info', ({ message }) => {
        this.logger.debug(message);
      });
      this.$on('query', ({ query, params }) => {
        this.logger.log(`${query}; ${params}`);
      });
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
