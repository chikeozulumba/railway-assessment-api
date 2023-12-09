import { InputType } from '@nestjs/graphql';
import { IsOptional, IsUUID } from 'class-validator';

@InputType()
export class ConnectRailwayAccountDTO {
  @IsOptional()
  @IsUUID()
  name?: string;

  @IsUUID()
  token: string;
}
