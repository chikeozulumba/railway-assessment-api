import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from 'src/models';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { AuthService } from './auth.service';
import { AuthorizeDTO } from './dto/auth.input';
import { GetUser } from 'src/common/decorators/user.decorator';
import { AuthUser } from 'src/@types/auth';

@UseGuards(AuthGuard)
@Resolver(() => User)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Query(() => User)
  async me(@GetUser() payload: AuthUser): Promise<User> {
    return await this.authService.profile(payload);
  }

  @Mutation(() => User)
  async authorize(
    @Args('payload')
    payload: AuthorizeDTO,
  ): Promise<User> {
    return await this.authService.authorizeUser(payload);
  }
}
