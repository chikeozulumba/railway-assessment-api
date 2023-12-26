import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/@types/auth';
import { GetUser } from 'src/common/decorators/user.decorator';
import { Project, Service } from 'src/models';
import { ServiceService } from './service.service';
import { CreateNewRailwayProjectServiceDTO } from './dto/service.input';
import { AuthGuard } from 'src/common/guards/auth.guard';

@UseGuards(AuthGuard)
@Resolver(() => Service)
export class ServiceResolver {
  constructor(readonly service: ServiceService) {}
  @Mutation(() => Project)
  async createNewRailwayProjectService(
    @Args('payload') payload: CreateNewRailwayProjectServiceDTO,
    @GetUser() user: AuthUser,
  ) {
    return await this.service.createNewRailwayProjectService(user, payload);
  }

  @Mutation(() => Boolean)
  async deleteRailwayService(
    @Args('id') id: string,
    @GetUser() user: AuthUser,
  ): Promise<boolean> {
    return await this.service.deleteRailwayService(user, id);
  }

  @Query(() => String)
  async getRailwayService(
    @Args('serviceId') serviceId: string,
    @GetUser() user: AuthUser,
  ) {
    return await this.service.getRailwayService(user, serviceId);
  }

  @Query(() => String)
  async getRailwayServiceDeployments(
    @Args('serviceId') serviceId: string,
    @GetUser() user: AuthUser,
  ) {
    return await this.service.getRailwayServiceDeployments(user, serviceId);
  }
}
