import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { AuthUser } from 'src/@types/auth';
import { GetRailwayDeploymentsDTO } from './dto/deployment.input';
import { ApolloError } from '@apollo/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CacheService } from 'src/cache/cache.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { GQL_GET_RAILWAY_PROJECT_DEPLOYMENTS_QUERY } from 'src/project/gql/query';
import { RailwayClientService } from 'src/railway-client/railway-client.service';
import { GQL_GET_RAILWAY_DEPLOYMENT_BUILD_LOGS_QUERY, GQL_GET_RAILWAY_DEPLOYMENT_BY_ID_QUERY, GQL_GET_RAILWAY_DEPLOYMENT_LOGS_QUERY } from './gql';
import { Token } from 'src/models';

@Injectable()
export class DeploymentService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cacheService: CacheService,
    private readonly railwayClientService: RailwayClientService,
  ) { }

  /**
   * Method for retrieving railway deployment by ID
   *
   * @param {AuthUser} user
   * @param {String} deploymentId
   *
   * @return {string}
   */
  async getDeployment(authUser: AuthUser, { deploymentId, tokenId }: { deploymentId: string; tokenId?: string; }) {
    try {
      const key = `DEPLOYMENT-${deploymentId}`.toLowerCase().replaceAll('/', '-');
      const cachedData = await this.cacheService.get<string | null>(key);
      if (cachedData) {
        return JSON.parse(String(cachedData));
      }

      const user = await this.prismaService.user.findFirstOrThrow({ where: { id: authUser.userId } });

      const tokenIdToBeUsed = tokenId || user.defaultRailwayTokenId;

      if (!tokenIdToBeUsed) {
        throw new UnauthorizedException('Invalid Railway token selected.');
      }

      const token = await this.prismaService.token.findFirstOrThrow({
        where: { id: tokenId, userId: user.id },
      });

      if (!token) {
        throw new UnauthorizedException('Invalid Railway token selected.');
      }

      let { data } = await this.railwayClientService.client.query({
        query: GQL_GET_RAILWAY_DEPLOYMENT_BY_ID_QUERY,
        variables: { id: deploymentId },
        context: {
          headers: {
            Authorization: 'Bearer ' + token.value,
          },
        },
      });

      data = JSON.stringify(data?.deployment || {});
      await this.cacheService.set(key, JSON.stringify(data), 600);

      return data;
    } catch (error) {
      throw new BadRequestException();
    }
  }

  /**
   * Method for retrieving railway project deployments
   *
   * @param {AuthUser} user
   * @param {GetRailwayDeploymentsDTO} payload
   *
   * @return {any}
   */
  async getDeployments(user: AuthUser, payload: GetRailwayDeploymentsDTO) {

  }

  /**
   * Method for retrieving railway project deployment build logs
   *
   * @param {AuthUser} user
   * @param {string} deploymentId
   * @param {string} tokenId
   *
   * @return {any}
   */
  async getDeploymentLogs(authUser: AuthUser, { deploymentId, tokenId, limit = "100" }: { deploymentId: string; tokenId?: string; [key: string]: number | string }) {
    try {
      const key = `DEPLOYMENT-LOGS-${deploymentId}-${limit}`.toLowerCase().replaceAll('/', '-');
      const cachedData = await this.cacheService.get<string | null>(key);
      if (cachedData) {
        return JSON.parse(String(cachedData));
      }

      let token: Token;

      if (tokenId) {
        token = await this.prismaService.token.findFirstOrThrow({ where: { id: tokenId, userId: authUser.userId } });
      } else {
        [token] = await this.prismaService.token.findMany({ where: { OR: [{ userId: authUser.userId }, { userId: authUser.userId, isDefault: true }] } });
      }

      if (!token) {
        throw new UnauthorizedException('Invalid Railway token selected.');
      }

      let { data } = await this.railwayClientService.client.query({
        query: GQL_GET_RAILWAY_DEPLOYMENT_LOGS_QUERY,
        variables: { deploymentId, limit: +limit },
        context: {
          headers: {
            Authorization: 'Bearer ' + token.value,
          },
        },
      });

      data = JSON.stringify(data?.deploymentLogs || {});
      await this.cacheService.set(key, JSON.stringify(data), 600);

      return data;
    } catch (error) {
      throw new BadRequestException();
    }
  }

  /**
   * Method for retrieving railway project deployment build logs
   *
   * @param {AuthUser} user
   * @param {string} deploymentId
   * @param {string} tokenId
   *
   * @return {any}
   */
  async getDeploymentBuildLogs(authUser: AuthUser, { deploymentId, tokenId, limit = "100" }: { deploymentId: string; tokenId?: string; [key: string]: number | string }) {
    try {
      const key = `DEPLOYMENT-BUILD-LOGS-${deploymentId}-${limit}`.toLowerCase().replaceAll('/', '-');
      const cachedData = await this.cacheService.get<string | null>(key);
      if (cachedData) {
        return JSON.parse(String(cachedData));
      }

      let token: Token;

      if (tokenId) {
        token = await this.prismaService.token.findFirstOrThrow({ where: { id: tokenId, userId: authUser.userId } });
      } else {
        [token] = await this.prismaService.token.findMany({ where: { OR: [{ userId: authUser.userId }, { userId: authUser.userId, isDefault: true }] } });
      }

      if (!token) {
        throw new UnauthorizedException('Invalid Railway token selected.');
      }

      let { data } = await this.railwayClientService.client.query({
        query: GQL_GET_RAILWAY_DEPLOYMENT_BUILD_LOGS_QUERY,
        variables: { deploymentId, limit: +limit },
        context: {
          headers: {
            Authorization: 'Bearer ' + token.value,
          },
        },
      });

      data = JSON.stringify(data?.buildLogs || {});
      await this.cacheService.set(key, JSON.stringify(data), 600);

      return data;
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
