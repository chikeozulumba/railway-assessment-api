import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

@ObjectType()
export class UserGithubRepositoryDTO {
  @Field()
  id: string;

  @Field()
  fullName: string;

  @Field()
  defaultBranch: string;

  @Field()
  isPrivate: boolean;
}
