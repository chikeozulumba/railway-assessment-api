import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RailwayClientModule } from 'src/railway-client/railway-client.module';
import { RailwayClientService } from 'src/railway-client/railway-client.service';
import { ConfigModule } from 'src/config/config.module';
import { UserProcessor } from './user.processor';
import { CacheModule } from 'src/cache/cache.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'QUEUE_USER',
    }),
    RailwayClientModule,
    ConfigModule,
    CacheModule,
  ],
  providers: [
    UserResolver,
    UserService,
    PrismaService,
    RailwayClientService,
    UserProcessor,
  ],
})
export class UserModule {}
