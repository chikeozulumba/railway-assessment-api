import { Args, Query, Resolver } from '@nestjs/graphql';
import { DeploymentService } from './deployment.service';
import { UseGuards } from '@nestjs/common';
import { AuthUser } from 'src/@types/auth';
import { GetUser } from 'src/common/decorators/user.decorator';
import { GetRailwayDeploymentsDTO } from './dto/deployment.input';
import { AuthGuard } from 'src/common/guards/auth.guard';

@UseGuards(AuthGuard)
@Resolver()
export class DeploymentResolver {
  constructor(readonly service: DeploymentService) { }
  @Query(() => String)
  async getDeployments(
    @Args('payload') payload: GetRailwayDeploymentsDTO,
    @GetUser() user: AuthUser,
  ) {
    return await this.service.getDeployments(user, payload);
  }

  @Query(() => String)
  async getDeployment(
    @GetUser() user: AuthUser,
    @Args('deploymentId') deploymentId: string,
    @Args('tokenId') tokenId?: string,
  ) {
    return await this.service.getDeployment(user, { deploymentId, tokenId });
  }

  @Query(() => String)
  async getDeploymentLogs(
    @GetUser() user: AuthUser,
    @Args('deploymentId') deploymentId: string,
    @Args('tokenId') tokenId?: string,
    @Args('limit') limit?: string,
  ) {
    return await this.service.getDeploymentLogs(user, { deploymentId, tokenId, limit });
  }

  @Query(() => String)
  async getDeploymentBuildLogs(
    @GetUser() user: AuthUser,
    @Args('deploymentId') deploymentId: string,
    @Args('tokenId') tokenId?: string,
    @Args('limit') limit?: string,
  ) {
    return await this.service.getDeploymentBuildLogs(user, { deploymentId, tokenId, limit });
  }
}
