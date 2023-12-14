import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ConfigService } from 'src/config/config.service';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { ConfigModule } from 'src/config/config.module';

const configService = new ConfigService();

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: +configService.get('JWT_EXPIRES') },
    }),
    ConfigModule,
  ],
  providers: [AuthService, AuthResolver, AuthGuard],
})
export class AuthModule {}
