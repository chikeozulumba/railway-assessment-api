import { Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

@InputType()
class Repo {
  @Field()
  fullRepoName: string;

  @Field()
  branch: string;
}

@InputType()
export class CreateNewRailwayProjectDTO {
  @Field()
  @IsOptional()
  tokenId: string;

  @Field()
  name: string;

  @Field()
  @IsOptional()
  description?: string;

  @Field()
  @IsOptional()
  prDeploys?: boolean;

  @Field()
  @IsOptional()
  isPublic?: boolean;

  @Field({ defaultValue: 'production' })
  defaultEnvironmentName?: string;

  @Field(() => Repo)
  @IsOptional()
  repo?: Repo;
}
