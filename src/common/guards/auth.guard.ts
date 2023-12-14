import {
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from 'src/config/config.service';

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
  logger = new Logger(AuthGuard.name);

  @Inject()
  configService: ConfigService;

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  async canActivate(context: ExecutionContext) {
    try {
      const clerkPublicKey = this.configService.get('CLERK_PEM_PUBLIC_KEY');
      const request = this.getRequest(context);
      const sessionToken = request.cookies['__session'];
      const headerToken = request.headers['x-auth-token'];

      const token = sessionToken || headerToken;

      if (!token) {
        return false;
      }

      const decoded = jwt.verify(token, clerkPublicKey);
      request.user = decoded;

      return true;
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException();
    }
  }
}
