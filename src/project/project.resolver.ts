import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { Project } from 'src/models';
import { ProjectService } from './project.service';
import { GetUser } from 'src/common/decorators/user.decorator';
import { CreateNewRailwayProjectDTO } from './dto/project.input';
import type { AuthUser } from 'src/@types/auth';

@UseGuards(AuthGuard)
@Resolver(() => Project)
export class ProjectResolver {
  constructor(readonly projectService: ProjectService) {}

  @Mutation(() => Project)
  async createNewRailwayProject(
    @Args('payload') payload: CreateNewRailwayProjectDTO,
    @GetUser() user: AuthUser,
  ) {
    return await this.projectService.createNewRailwayProject(user, payload);
  }
}
