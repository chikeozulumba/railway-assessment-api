import { Module } from '@nestjs/common';
import { DeploymentService } from './deployment.service';
import { DeploymentResolver } from './deployment.resolver';
import { RailwayClientModule } from 'src/railway-client/railway-client.module';
import { ConfigModule } from 'src/config/config.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CacheModule } from 'src/cache/cache.module';

@Module({
  imports: [RailwayClientModule, ConfigModule, PrismaModule, CacheModule],
  providers: [DeploymentService, DeploymentResolver]
})
export class DeploymentModule {}
