import { Module } from '@nestjs/common';
import { ProjectResolver } from './project.resolver';
import { ProjectService } from './project.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RailwayClientModule } from 'src/railway-client/railway-client.module';

@Module({
  imports: [PrismaModule, RailwayClientModule],
  providers: [ProjectResolver, ProjectService],
})
export class ProjectModule {}
