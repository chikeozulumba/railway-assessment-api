import { Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

@InputType()
export class GetRailwayDeploymentsDTO {
  @Field()
  @IsOptional()
  projectId?: string;

  @Field()
  @IsOptional()
  serviceId?: string;
}
