import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from 'src/models';
import { AuthenticateDTO } from './dto/auth.input';
import { AuthProvider, AuthUser } from 'src/@types/auth';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Method for authroizing user account
   *
   * @param {AuthenticateDTO} credentials
   * @return void
   */
  async authorizeUser(credentials: AuthenticateDTO): Promise<User> {
    try {
      const user = await this.findOrCreateUser(credentials);
      this.verifyUserAccountStatus(user);

      return user;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException({
        statusCode: error.code || HttpStatus.INTERNAL_SERVER_ERROR,
        message:
          error.message || 'Your request cannot be processed at this time.',
      });
    }
  }

  /**
   * Method for retrieving user account
   *
   * @return void
   */
  async profile(payload: AuthUser): Promise<User> {
    try {
      return await this.prismaService.user.findFirstOrThrow({
        where: {
          providerId: payload.user_id,
          provider: payload.provider.toUpperCase() as AuthProvider,
        },
      });
    } catch (error) {
      throw new NotFoundException({
        message: 'Profile not found.',
        status: 'not-found',
      });
    }
  }

  /**
   * Method for verifying user account status
   *
   * @return void
   */
  verifyUserAccountStatus(user: User) {
    switch (user.status) {
      case 'suspended':
        throw new ForbiddenException(
          'Your account is temporarily suspended from use.',
        );
      case 'deleted':
        throw new ForbiddenException('Account does not exist.');
      default:
        break;
    }
  }

  /**
   * Method for returning user account profile
   *
   * @param {AuthenticateDTO} payload
   * @return {User}
   */
  async findOrCreateUser(payload: AuthenticateDTO): Promise<User> {
    const { email, provider, providerId } = payload;
    try {
      // Check if account exists
      let user = await this.prismaService.user.findFirst({
        where: {
          OR: [
            { providerId, provider },
            { email, provider },
          ],
        },
      });

      if (!user) {
        // Create new user account
        user = await this.prismaService.user.create({ data: payload });
      }

      return user;
    } catch (error) {
      throw error;
    }
  }
}
