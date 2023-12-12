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
import {
  GQL_USER_GITHUB_REPOSITORY_WITH_BRANCHES_QUERY,
  GQL_USER_PROJECTS_AND_PROFILE_QUERY,
} from './gql';
import { RemoveRailwayToken } from './models/token.model';
import type { Project, Token, User, UserRepository } from 'src/models';
import type { AuthUser } from 'src/@types/auth';

@Injectable()
export class UserService {
  constructor(
    @InjectQueue('QUEUE_USER')
    private readonly userQueue: Queue,
    private readonly prismaService: PrismaService,
    private readonly railwayClientService: RailwayClientService,
  ) {}

  /**
   * Method for removing railway token by ID
   *
   * @param {string} token
   * @param {User} user
   * @return {RailwayToken[]}
   */
  async removeRailwayToken(
    id: string,
    { user_id: providerId, provider }: AuthUser,
  ): Promise<RemoveRailwayToken> {
    const user = await this.prismaService.user.findFirstOrThrow({
      where: { provider, providerId },
    });

    await this.prismaService.token.delete({
      where: {
        userId: user.id,
        id,
      },
    });

    return { status: 'success' };
  }

  /**
   * Method for retrieving railway tokens
   *
   * @param {User} user
   * @return {Token[]}
   */
  async getRailwayTokens({
    user_id: providerId,
    provider,
  }: AuthUser): Promise<Token[]> {
    const user = await this.prismaService.user.findFirstOrThrow({
      where: { provider, providerId },
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
  async railwayProjects({
    user_id: providerId,
    provider,
  }: AuthUser): Promise<Project[]> {
    const user = await this.prismaService.user.findFirstOrThrow({
      where: { provider, providerId },
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
    { provider, user_id: providerId }: AuthUser,
    { repoId, tokenId }: { [key: string]: string },
  ): Promise<any> {
    const user = await this.prismaService.user.findFirstOrThrow({
      where: { provider, providerId },
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

    if (!repository.branchesLoaded) {
      const [owner, repo] = repository.fullName.split('/');
      const { data } = await this.railwayClientService.client.query({
        query: GQL_USER_GITHUB_REPOSITORY_WITH_BRANCHES_QUERY,
        variables: { owner, repo },
        context: {
          headers: {
            Authorization: 'Bearer ' + token.value,
          },
        },
      });

      repository = await this.prismaService.userRepository.update({
        where: { id: repository.id },
        data: {
          branches: data.githubRepoBranches.map(({ name }) => name),
          branchesLoaded: true,
        },
      });
    }

    return repository.branches;
  }

  /**
   * Method for retrieving user repository branches
   *
   * @param {User} user
   * @return {Partial<UserRepository>[]}
   */
  async fetchUserGithubRepositories({
    user_id: providerId,
    provider,
  }: AuthUser): Promise<Partial<UserRepository>[]> {
    const user = await this.prismaService.user.findFirstOrThrow({
      where: { provider, providerId },
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
   * @param {string} token
   * @param {User} user
   *
   * @return {User}
   */
  async connectRailwayAccount(
    token: string,
    tokenName: string,
    { user_id: providerId, provider }: AuthUser,
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
            where: { providerId, provider },
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

          const updateProfilePayload = {
            railwayId: profile.id,
            name: profile.name,
            email: profile.email,
            username: profile.username,
            avatar: profile.avatar,
            currentCost: String(profile.cost?.current) || '0',
            estimatedCost: String(profile.cost?.estimated) || '0',
            registrationStatus: profile.registrationStatus,
            userId: user.id,
            status: 'active',
          };

          await prisma.profile.updateMany({
            where: { userId: user.id, AND: { NOT: { railwayId: profile.id } } },
            data: { status: 'inactive' },
          });

          await prisma.profile.upsert({
            where: { railwayId: profile.id, userId: user.id },
            create: updateProfilePayload,
            update: updateProfilePayload,
          });

          const createdToken = await prisma.token.create({
            data: { userId: user.id, value: token, name: tokenName },
          });

          if (!user.railwayAccountStatus?.split('-').includes('profile')) {
            user = await prisma.user.update({
              where: {
                id: user.id,
              },
              data: {
                railwayAccountStatus: 'profile',
                activeRailwayToken: createdToken.id,
              },
            });
          }

          await this.userQueue.add('LOAD_GITHUB_REPOSITORIES', {
            token,
            user,
          });

          await this.userQueue.add('LOAD_PROJECTS_AND_SERVICES', {
            user,
            railwayId: profile.id,
            projects: railwayProjects.edges,
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
