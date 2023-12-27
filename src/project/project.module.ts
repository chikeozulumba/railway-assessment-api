import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ProjectResolver } from './project.resolver';
import { ProjectService } from './project.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RailwayClientModule } from 'src/railway-client/railway-client.module';
import { ConfigModule } from 'src/config/config.module';
import { CacheModule } from 'src/cache/cache.module';
import { ProjectProcessor } from './project.processor';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'QUEUE_PROJECT',
    }),
    BullModule.registerQueue({
      name: 'QUEUE_USER',
    }),
    UserModule,
    PrismaModule,
    RailwayClientModule,
    ConfigModule,
    CacheModule
  ],
  providers: [ProjectResolver, ProjectService, ProjectProcessor],
})
export class ProjectModule {}
