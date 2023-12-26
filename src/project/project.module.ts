import { Module } from '@nestjs/common';
import { ProjectResolver } from './project.resolver';
import { ProjectService } from './project.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RailwayClientModule } from 'src/railway-client/railway-client.module';
import { ConfigModule } from 'src/config/config.module';
import { CacheModule } from 'src/cache/cache.module';

@Module({
  imports: [PrismaModule, RailwayClientModule, ConfigModule, CacheModule],
  providers: [ProjectResolver, ProjectService],
})
export class ProjectModule {}
