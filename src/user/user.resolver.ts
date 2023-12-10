import { UserService } from './user.service';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GetUser } from 'src/common/decorators/user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RailwayToken, User } from 'src/models';
import { AuthUser } from 'src/@types/auth';
import { ConnectRailwayAccountDTO } from './dto/user.input';
import { RemoveRailwayToken } from './models/token.model';

@UseGuards(AuthGuard)
@Resolver(() => User)
export class UserResolver {
  constructor(readonly userService: UserService) {}

  @Mutation(() => User)
  async connectRailwayAccount(
    @Args('payload') { token, name }: ConnectRailwayAccountDTO,
    @GetUser() user: AuthUser,
  ) {
    return await this.userService.connectRailwayAccount(token, name, user);
  }

  @Mutation(() => RemoveRailwayToken)
  async removeRailwayToken(@Args('id') id: string, @GetUser() user: AuthUser) {
    return await this.userService.removeRailwayToken(id, user);
  }

  @Query(() => [RailwayToken])
  async getRailwayTokens(@GetUser() user: AuthUser) {
    return await this.userService.getRailwayTokens(user);
  }
}
