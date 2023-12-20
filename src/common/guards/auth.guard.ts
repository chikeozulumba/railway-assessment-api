import {
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from 'src/config/config.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
  logger = new Logger(AuthGuard.name);

  @Inject()
  configService: ConfigService;

  @Inject()
  prismaService: PrismaService;

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  async canActivate(context: ExecutionContext) {
    try {
      const clerkPublicKey = this.configService.get('CLERK_PEM_PUBLIC_KEY');
      const request: Request = this.getRequest(context);
      const sessionToken = request.cookies['__session'];
      const headerToken = request.headers['x-auth-token'];

      const token = sessionToken || headerToken;

      if (!token) {
        return false;
      }

      const decoded = jwt.verify(token, clerkPublicKey);
      let user = await this.prismaService.user.findFirst({
        where: { uid: decoded.sub },
      });

      if (!user && request.body?.operationName === 'Authorize') {
        return true;
      } 

      request.user = { userId: user.id, ...decoded };
      return true;
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException();
    }
  }
}
