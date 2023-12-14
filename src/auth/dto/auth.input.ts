import { Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

@InputType()
export class AuthorizeDTO {
  @Field()
  uid: string;

  @Field()
  @IsOptional()
  fullName?: string;
}
