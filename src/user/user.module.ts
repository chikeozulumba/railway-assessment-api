import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RailwayClientModule } from 'src/railway-client/railway-client.module';
import { RailwayClientService } from 'src/railway-client/railway-client.service';
import { ConfigModule } from 'src/config/config.module';

@Module({
  imports: [RailwayClientModule, ConfigModule],
  providers: [UserResolver, UserService, PrismaService, RailwayClientService],
})
export class UserModule {}
