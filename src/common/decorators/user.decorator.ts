import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from 'src/models';

export const GetUser = createParamDecorator(
  (data, context: ExecutionContext): User => {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;
    return req.user;
  },
);
