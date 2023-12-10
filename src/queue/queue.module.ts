import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigService } from 'src/config/config.service';

const configService = new ConfigService();

@Module({
  imports: [
    BullModule.forRoot({
      redis: configService.get('REDIS_URL'),
      prefix: 'RFS-',
    }),
  ],
})
export class QueueModule {}
