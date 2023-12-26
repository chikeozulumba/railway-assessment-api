import { Module } from '@nestjs/common';
import { DirectiveLocation, GraphQLDirective } from 'graphql';
import { Enhancer, GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { LoggerModule } from 'nestjs-pino';
import { upperDirectiveTransformer } from './common/directives/upper-case.directive';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { RailwayClientModule } from './railway-client/railway-client.module';
import { QueueModule } from './queue/queue.module';
import { ProjectModule } from './project/project.module';
import { CacheModule } from './cache/cache.module';
import { ServiceModule } from './service/service.module';
import { DeploymentResolver } from './deployment/deployment.resolver';
import { DeploymentModule } from './deployment/deployment.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        customProps: () => ({
          context: 'HTTP',
        }),
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: false,
            singleLine: true,
            levelFirst: false,
            translateTime: "yyyy-mm-dd'T'HH:MM:ss.l'Z'",
            messageFormat: '{req.headers.x-correlation-id} [{context}] {msg}',
            ignore: 'pid,hostname,context,req,res.headers',
            errorLikeObjectKeys: ['err', 'error'],
          },
        },
      },
    }),
    CacheModule,
    ConfigModule,
    PrismaModule,
    QueueModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: true,
      autoSchemaFile: 'schema.gql',
      transformSchema: (schema) => upperDirectiveTransformer(schema, 'upper'),
      installSubscriptionHandlers: true,
      buildSchemaOptions: {
        directives: [
          new GraphQLDirective({
            name: 'upper',
            locations: [DirectiveLocation.FIELD_DEFINITION],
          }),
        ],
      },
      subscriptions: {
        'graphql-ws': true,
        'subscriptions-transport-ws': true,
      },
      fieldResolverEnhancers: ['interceptors'] as Enhancer[],
      autoTransformHttpErrors: true,
      context: (context) => context,
      formatError: (error) => {
        const originalError = error.extensions?.originalError as Error;

        if (!originalError) {
          return {
            message: error.message,
            code: error.extensions?.code,
          };
        }
        return {
          message: originalError.message,
          code: error.extensions?.code,
        };
      },
    }),
    UserModule,
    AuthModule,
    RailwayClientModule,
    ProjectModule,
    ServiceModule,
    DeploymentModule,
  ],
})
export class AppModule {}
