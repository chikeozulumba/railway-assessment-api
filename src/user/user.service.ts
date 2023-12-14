import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ApolloError } from '@apollo/client/core';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { PrismaService } from 'src/prisma/prisma.service';
import { RailwayClientService } from './../railway-client/railway-client.service';
import { CacheService } from 'src/cache/cache.service';
import {
  GQL_USER_GITHUB_REPOSITORY_WITH_BRANCHES_QUERY,
  GQL_USER_PROJECTS_AND_PROFILE_QUERY,
} from './gql';
import { RemoveRailwayToken } from './models/token.model';
import { ConnectRailwayAccountDTO } from './dto/user.input';
import type { Project, Token, User, UserRepository } from 'src/models';
import type { AuthUser } from 'src/@types/auth';

@Injectable()
export class UserService {
  constructor(
    @InjectQueue('QUEUE_USER')
    private readonly userQueue: Queue,
    private readonly prismaService: PrismaService,
    private readonly cacheService: CacheService,
    private readonly railwayClientService: RailwayClientService,
  ) { }

  /**
   * Method for removing railway token by ID
   *
   * @param {string} token
   * @param {User} user
   * @return {RailwayToken[]}
   */
  async removeRailwayToken(
    id: string,
    { sub: uid }: AuthUser,
  ): Promise<RemoveRailwayToken> {
    const user = await this.prismaService.user.findFirstOrThrow({
      where: { uid },
    });

    await this.prismaService.token.delete({
      where: {
        userId: user.id,
        id,
      },
    });

    await this.userQueue.add('REMOVE_REPO_AND_PROJECTS_AND_SERVICES', {
      tokenId: id,
    });

    return { status: 'success' };
  }

  /**
   * Method for retrieving railway tokens
   *
   * @param {User} user
   * @return {Token[]}
   */
  async getRailwayTokens({ sub: uid }: AuthUser): Promise<Token[]> {
    const user = await this.prismaService.user.findFirstOrThrow({
      where: { uid },
      include: { tokens: true },
    });

    return user.tokens.map((t) => ({
      ...t,
      value:
        'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx-' +
        t.value.split('-').pop().substring(8, 12),
    }));
  }

  /**
   * Method for retrieving railway projects
   *
   * @param {User} user
   * @return {Project[]}
   */
  async railwayProjects({ sub: uid }: AuthUser): Promise<Project[]> {
    const user = await this.prismaService.user.findFirstOrThrow({
      where: { uid },
      include: {
        projects: { include: { services: { include: { instances: true } } } },
      },
    });

    return user.projects;
  }

  /**
   * Method for retrieving user repositories
   *
   * @param {User} user
   * @return {any}
   */
  async fetchUserGithubRepositoryBranches(
    { sub: uid }: AuthUser,
    { repoId, tokenId }: { [key: string]: string },
  ): Promise<any> {
    try {
      const user = await this.prismaService.user.findFirstOrThrow({
        where: { uid },
        include: {
          repositories: true,
          tokens: true,
        },
      });

      const tokenIdToBeUsed = tokenId || user.activeRailwayToken;

      let repository = user.repositories.find((repo) => repo.id === repoId);
      const token = user.tokens.find((token) => token.id === tokenIdToBeUsed);

      if (!repository) {
        throw new BadRequestException(`Repository not found.`);
      }

      if (!token) {
        throw new BadRequestException(`Invalid Railway token selected.`);
      }

      const key = `GITHUB-BR-${repository.fullName}`.toLowerCase();
      const data = await this.cacheService.get<string|null>(key);

      if (data) {
        return JSON.parse(String(data));
      }

      const [owner, repo] = repository.fullName.split('/');
      const response = await this.railwayClientService.client.query({
        query: GQL_USER_GITHUB_REPOSITORY_WITH_BRANCHES_QUERY,
        variables: { owner, repo },
        context: {
          headers: {
            Authorization: 'Bearer ' + token.value,
          },
        },
      });

      const branches = (response.data.githubRepoBranches || [])?.map((branch) => branch.name)

      await this.cacheService.set(key, JSON.stringify(branches));
      return branches;
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Method for retrieving user repository branches
   *
   * @param {User} user
   * @return {Partial<UserRepository>[]}
   */
  async fetchUserGithubRepositories({
    sub: uid,
  }: AuthUser): Promise<Partial<UserRepository>[]> {
    const user = await this.prismaService.user.findFirstOrThrow({
      where: { uid },
      include: {
        repositories: true,
      },
    });

    return user.repositories.map((repo) => ({
      id: repo.id,
      fullName: repo.fullName,
      defaultBranch: repo.defaultBranch,
    }));
  }

  /**
   * Method for connecting user railway account
   *
   * @param {Payload} payload
   * @param {User} user
   *
   * @return {User}
   */
  async connectRailwayAccount(
    { token, name: tokenName, isDefault }: ConnectRailwayAccountDTO,
    { sub: uid }: AuthUser,
  ): Promise<User> {
    try {
      return await this.prismaService.$transaction(
        async (prisma: PrismaClient) => {
          const checkIfTokenExists = await prisma.token.count({
            where: {
              value: token,
            },
          });

          if (checkIfTokenExists > 0) {
            throw new UnprocessableEntityException(
              'Railway API token is invalid',
            );
          }

          let user = await prisma.user.findFirst({
            where: { uid },
          });

          if (!user) {
            throw new UnauthorizedException(
              'You are not authorized to proceed',
            );
          }

          // Fetch profile from Railway
          const getUserRailwayProfileAndProjects =
            await this.railwayClientService.client.query({
              query: GQL_USER_PROJECTS_AND_PROFILE_QUERY,
              context: {
                headers: {
                  Authorization: 'Bearer ' + token,
                },
              },
            });

          const profile = getUserRailwayProfileAndProjects.data.me;
          const railwayProjects =
            getUserRailwayProfileAndProjects.data.projects;

          if (profile.registrationStatus !== 'REGISTERED') {
            throw new UnauthorizedException(
              'Account associated with this token is invalid.',
            );
          }

          if (isDefault) {
            await prisma.token.updateMany({ data: { isDefault: false }});
          }

          const createdToken = await prisma.token.create({
            data: { userId: user.id, value: token, name: tokenName, isDefault },
          });

          user = await prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              railwayAccountStatus: profile.registrationStatus,
              // activeRailwayToken: createdToken.id,
            },
          });

          await this.userQueue.add('LOAD_GITHUB_REPOSITORIES', {
            user,
            token: createdToken,
          });

          await this.userQueue.add('LOAD_PROJECTS_AND_SERVICES', {
            user,
            railwayId: profile.id,
            projects: railwayProjects.edges,
            token: createdToken,
          });

          return user;
        },
        {
          timeout: 20000,
        },
      );
    } catch (error) {
      console.log(error);
      if (error instanceof ApolloError) {
        throw new UnprocessableEntityException(
          error.message || 'You have provided an invalid API secret token.',
        );
      }

      throw error;
    }
  }
}
