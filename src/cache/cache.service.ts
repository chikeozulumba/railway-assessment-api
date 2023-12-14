import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { RedisStore } from 'cache-manager-redis-store';
import { ConfigService } from 'src/config/config.service';

@Injectable({})
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache & RedisStore,
    private readonly configService: ConfigService,
  ) {}

  async get<T = unknown>(key: string) {
    return await this.cache.get<T>(key);
  }

  async set(key: string, value: any, seconds = 600 /* 10min */) {
    if (this.configService.get('NODE_ENV') !== 'production') {
      await this.del(key);
    }
    return await this.cache.set(key, value, { ttl: seconds }, null);
  }

  async del(key: string) {
    return await this.cache.del(key);
  }
}
