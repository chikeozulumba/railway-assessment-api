import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { AuthProvider } from 'src/@types/auth';

registerEnumType(AuthProvider, {
  name: 'AuthProvider',
});

@InputType()
export class AuthenticateDTO {
  @IsEnum(AuthProvider)
  @Field({ defaultValue: null })
  provider: AuthProvider;

  @Field()
  providerId: string;

  @Field()
  @IsOptional()
  fullName: string;

  @Field({ defaultValue: null })
  @IsOptional()
  avatarUrl: string;

  @Field({ defaultValue: null })
  @IsOptional()
  @MaxLength(30)
  @IsEmail()
  email: string;
}
