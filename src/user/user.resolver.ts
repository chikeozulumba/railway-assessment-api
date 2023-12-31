import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserService } from './user.service';
import { GetUser } from 'src/common/decorators/user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { Project, Token, User } from 'src/models';
import { ConnectRailwayAccountDTO } from './dto/user.input';
import { RemoveRailwayToken } from './models/token.model';
import type { AuthUser } from 'src/@types/auth';
import { UserGithubRepositoryDTO } from './dto/repository.dto';

@UseGuards(AuthGuard)
@Resolver(() => User)
export class UserResolver {
  constructor(readonly userService: UserService) {}

  @Mutation(() => User)
  async connectRailwayAccount(
    @Args('payload') { token, name, isDefault }: ConnectRailwayAccountDTO,
    @GetUser() user: AuthUser,
  ) {
    return await this.userService.connectRailwayAccount(
      { token, name, isDefault },
      user,
    );
  }

  @Mutation(() => RemoveRailwayToken)
  async removeRailwayToken(@Args('id') id: string, @GetUser() user: AuthUser) {
    return await this.userService.removeRailwayToken(id, user);
  }

  @Query(() => [Token])
  async getRailwayTokens(@GetUser() user: AuthUser) {
    return await this.userService.getRailwayTokens(user);
  }

  @Query(() => [Project])
  async railwayProjects(@GetUser() user: AuthUser) {
    return await this.userService.railwayProjects(user);
  }

  @Query(() => [UserGithubRepositoryDTO])
  async fetchUserGithubRepositories(
    @GetUser() user: AuthUser,
    @Args({ name: 'tokenId', nullable: true }) tokenId?: string,
  ) {
    return await this.userService.fetchUserGithubRepositories(user, tokenId);
  }

  @Query(() => [String])
  async fetchUserGithubRepositoryBranches(
    @GetUser() user: AuthUser,
    @Args('repo') repo: string,
    @Args({ name: 'tokenId', nullable: true }) tokenId?: string,
  ) {
    return await this.userService.fetchUserGithubRepositoryBranches(user, {
      repo,                                                                                                                                                    
      tokenId,
    });
  }
}
