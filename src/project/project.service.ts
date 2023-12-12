import { BadRequestException, Injectable } from '@nestjs/common';
import { ApolloError } from '@apollo/client/core';
import { CreateNewRailwayProjectDTO } from './dto/project.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { RailwayClientService } from 'src/railway-client/railway-client.service';
import { GQL_CREATE_RAILWAY_PROJECT_MUTATION } from './gql';
import type { AuthUser } from 'src/@types/auth';

@Injectable()
export class ProjectService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly railwayClientService: RailwayClientService,
  ) {}
  /**
   * Method for creating new railway projects
   *
   * @param {AuthUser} user
   * @param {CreateNewRailwayProjectDTO} payload
   *
   * @return {any}
   */
  async createNewRailwayProject(
    { provider, user_id: providerId }: AuthUser,
    { tokenId, ...payload }: CreateNewRailwayProjectDTO,
  ) {
    try {
      console.log(payload);
      const user = await this.prismaService.user.findFirstOrThrow({
        where: { provider, providerId },
        include: {
          profile: true,
          tokens: true,
        },
      });

      const token = user.tokens.find((token) => token.id === tokenId);

      if (!token) {
        throw new BadRequestException(`Invalid Railway token selected.`);
      }

      const { data } = await this.railwayClientService.client.mutate({
        mutation: GQL_CREATE_RAILWAY_PROJECT_MUTATION,
        variables: { payload: { ...payload } },
        context: {
          headers: {
            Authorization: 'Bearer ' + token.value,
          },
        },
      });

      const record = data.projectCreate;

      return await this.prismaService.project.create({
        data: {
          userId: user.id,
          profileId: user.profile[0].id,
          railwayProjectId: record.id,
          name: record.name,
          description: record.description,
          projectCreatedAt: record.createdAt,
          projectUpdatedAt: record.updatedAt,
          prDeploys: record.prDeploys,
          prForks: record.prForks,
        },
      });
    } catch (error) {
      if (error instanceof ApolloError) {
        console.log(JSON.stringify(error));
        throw new BadRequestException(
          'Error encountered while creating project on Railway.',
        );
      }

      throw error;
    }
  }
}
