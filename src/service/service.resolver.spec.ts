import { Test, TestingModule } from '@nestjs/testing';
import { ServiceResolver } from './service.resolver';

describe('ServiceResolver', () => {
  let resolver: ServiceResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceResolver],
    }).compile();

    resolver = module.get<ServiceResolver>(ServiceResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
