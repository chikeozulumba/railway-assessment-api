import { Module } from '@nestjs/common';
import { ServiceResolver } from './service.resolver';
import { ServiceService } from './service.service';
import { ConfigModule } from 'src/config/config.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RailwayClientModule } from 'src/railway-client/railway-client.module';
import { CacheModule } from 'src/cache/cache.module';

@Module({
  imports: [ConfigModule, PrismaModule, RailwayClientModule, CacheModule],
  providers: [ServiceResolver, ServiceService],
})
export class ServiceModule {}
