import {
  Injectable,
  Logger,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ApolloError } from '@apollo/client/core';
import { AuthUser } from 'src/@types/auth';
import { PrismaService } from 'src/prisma/prisma.service';
import { RailwayClientService } from './../railway-client/railway-client.service';
import { GQL_USER_PROJECTS_AND_PROFILE_QUERY } from './gql';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);

  constructor(
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
  ) {
    const user = await this.prismaService.user.findFirstOrThrow({
      where: { provider, providerId },
    });

    await this.prismaService.railwayToken.delete({
      where: {
        userId: user.id,
        id,
      },
    });

    return 'success';
  }

  /**
   * Method for retrieving railway tokens
   *
   * @param {User} user
   * @return {RailwayToken[]}
   */
  async getRailwayTokens({ user_id: providerId, provider }: AuthUser) {
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
  ) {
    try {
      return await this.prismaService.$transaction(
        async (prisma: PrismaClient) => {
          const checkIfTokenExists = await prisma.railwayToken.count({
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
          // const railwayProjects =
          //   getUserRailwayProfileAndProjects.data.projects;

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

          await prisma.railwayProfile.updateMany({
            where: { userId: user.id, AND: { NOT: { railwayId: profile.id } } },
            data: { status: 'inactive' },
          });

          await prisma.railwayProfile.upsert({
            where: { railwayId: profile.id, userId: user.id },
            create: updateProfilePayload,
            update: updateProfilePayload,
          });

          const createdToken = await prisma.railwayToken.create({
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
