import {
  Catch,
  ConflictException,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements GqlExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError): any {
    switch (exception.code) {
      case 'P2002': {
        throw new ConflictException('Some fields are already in use.');
      }
      case 'P2003': {
        throw new UnprocessableEntityException(
          'Your request cannot be processed at this time.',
        );
      }
      case 'P2025': {
        throw new NotFoundException('Resource not available.');
      }
      default:
        break;
    }
    return exception;
  }
}
