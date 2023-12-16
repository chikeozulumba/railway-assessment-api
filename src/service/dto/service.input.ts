import { Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

@InputType()
class CreateNewRailwayProjectServiceSource {
  @Field()
  @IsOptional()
  image?: string;

  @Field()
  @IsOptional()
  repo?: string;
}

@InputType()
class CreateNewRailwayProjectServiceVariables {
  @Field()
  key: string;

  @Field()
  value: string;
}

@InputType()
export class CreateNewRailwayProjectServiceDTO {
  @Field()
  @IsOptional()
  tokenId?: string;

  @Field()
  projectId: string;

  @Field()
  @IsOptional()
  name?: string;

  @Field()
  @IsOptional()
  branch?: string;

  @Field()
  @IsOptional()
  variables?: CreateNewRailwayProjectServiceVariables[];

  @Field(() => CreateNewRailwayProjectServiceSource)
  @IsOptional()
  source?: CreateNewRailwayProjectServiceSource;
}
