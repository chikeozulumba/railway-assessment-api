import { InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class UserGithubRepositoryDTO {
  @IsUUID()
  id: string;

  @IsUUID()
  fullName: string;

  @IsUUID()
  defaultBranch: string;

  @IsUUID()
  isPrivate: boolean;
}
