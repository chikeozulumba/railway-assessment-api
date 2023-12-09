import { Test, TestingModule } from '@nestjs/testing';
import { RailwayClientService } from './railway-client.service';

describe('RailwayClientService', () => {
  let service: RailwayClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RailwayClientService],
    }).compile();

    service = module.get<RailwayClientService>(RailwayClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
