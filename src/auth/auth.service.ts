import {
  HttpStatus,                                             
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from 'src/models';
import { AuthorizeDTO } from './dto/auth.input';
import { AuthUser } from 'src/@types/auth';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Method for authroizing user account
   *
   * @param {AuthorizeDTO} credentials
   * @return void
   */
  async authorizeUser(credentials: AuthorizeDTO): Promise<User> {
    try {
      const user = await this.findOrCreateUser(credentials);

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
  async profile({ sub: uid }: AuthUser): Promise<User> {
    try {
      return await this.prismaService.user.findFirstOrThrow({
        where: {
          uid,
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
   * Method for returning user account profile
   *
   * @param {AuthorizeDTO} payload
   * @return {User}
   */
  async findOrCreateUser(payload: AuthorizeDTO): Promise<User> {
    const { uid } = payload;
    try {
      // Check if account exists
      let user = await this.prismaService.user.findFirst({
        where: { uid },
      });

      // Create new user account
      if (!user) {
        user = await this.prismaService.user.create({
          data: {
            uid,
            fullName: payload.fullName,
          },
        });
      }

      return user;
    } catch (error) {
      throw error;
    }
  }
}
