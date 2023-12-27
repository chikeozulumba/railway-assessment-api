import { InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class ConnectRailwayAccountDTO {
  @IsOptional()
  name?: string;

  @IsUUID()
  token: string;

  @IsBoolean()
  isDefault?: boolean;
}
