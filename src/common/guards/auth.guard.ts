import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { getAuth } from 'firebase-admin/auth';
import { firebaseApp } from 'src/lib/firebase';

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
  logger = new Logger(AuthGuard.name);
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  async canActivate(context: ExecutionContext) {
    try {
      const request = this.getRequest(context);
      const token = request.headers['x-auth-token'];

      if (!token) {
        return false;
      }

      const response = await getAuth(firebaseApp).verifyIdToken(token);
      const { firebase } = response;
      const provider = firebase.sign_in_provider.split('.')[0];
      request.user = { ...response, provider };

      return true;
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException();
    }
  }
}
