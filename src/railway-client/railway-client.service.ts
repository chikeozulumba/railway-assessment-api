import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client/core';
import { ConfigService } from 'src/config/config.service';

@Injectable()
export class RailwayClientService implements OnModuleInit {
  client: ApolloClient<NormalizedCacheObject>;

  @Inject()
  configService: ConfigService;

  constructor() {}

  async onModuleInit() {
    this.client = new ApolloClient({
      uri: this.configService.get('RAILWAY_GRAPHQL_API'),
      cache: new InMemoryCache(),
    });
  }
}
