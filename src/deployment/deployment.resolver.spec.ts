import { Test, TestingModule } from '@nestjs/testing';
import { DeploymentResolver } from './deployment.resolver';

describe('DeploymentResolver', () => {
  let resolver: DeploymentResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeploymentResolver],
    }).compile();

    resolver = module.get<DeploymentResolver>(DeploymentResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
