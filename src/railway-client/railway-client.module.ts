import { Module } from '@nestjs/common';
import { ConfigModule } from 'src/config/config.module';
import { RailwayClientService } from './railway-client.service';

@Module({
  imports: [ConfigModule],
  providers: [RailwayClientService],
  exports: [RailwayClientService],
})
export class RailwayClientModule {}
