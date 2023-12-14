import { Module } from '@nestjs/common';
import { CacheModule as AppCacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { ConfigService } from 'src/config/config.service';
import { ConfigModule } from 'src/config/config.module';
import { CacheService } from './cache.service';

@Module({
  imports: [
    AppCacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return [
          {
            store: await redisStore.redisStore({
              name: 'cache',
              url: configService.get('REDIS_URL'),
              password: configService.get('REDIS_PASSWORD', false),
              ttl: +configService.get('REDIS_TIMEOUT', false),
              username: configService.get('REDIS_USERNAME', false),
            }),
          },
        ];
      },

      inject: [ConfigService],
    }),
  ],
  exports: [AppCacheModule, CacheService],
  providers: [CacheService, ConfigService],
})
export class CacheModule {}
