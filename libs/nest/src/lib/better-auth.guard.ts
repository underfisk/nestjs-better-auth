import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { Auth } from 'better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import {
  InjectBetterAuth,
  InjectBetterAuthModuleOptions,
} from './better-auth-decorators';
import { BetterAuthModuleOptions } from './types';
import { REQ_SESSION_KEY } from './constants';

@Injectable()
export class BetterAuthGuard implements CanActivate {
  constructor(
    @InjectBetterAuthModuleOptions()
    private readonly moduleOptions: BetterAuthModuleOptions,
    @Inject(Reflector)
    private readonly reflector: Reflector,
    @InjectBetterAuth()
    private readonly auth: Auth,
  ) {}

  /**
   * Validates HTTP request and checks if the user is authenticated.
   * If the request is authenticated, it will add the session to the request object.
   * If the request is not authenticated, it will throw an UnauthorizedException.
   * **Note** Non-HTTP contexts are not supported such as WebSocket or GraphQL.
   *
   * @param context
   * @returns
   */
  async canActivate(context: ExecutionContext) {
    if (this.moduleOptions.skipAuthDecoratorMetadataKey) {
      const shouldSkip = this.reflector.getAllAndOverride<boolean>(
        this.moduleOptions.skipAuthDecoratorMetadataKey,
        [context.getHandler(), context.getClass()],
      );

      if (shouldSkip) return true;
    }

    const request = context.switchToHttp().getRequest();

    const session = await this.auth.api.getSession({
      headers: fromNodeHeaders(request?.headers),
    });

    // Decorate the request with the session and user information
    // As we'll be able to access in the decorators
    (request as any)[REQ_SESSION_KEY] = session;

    if (!session) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
      });
    }

    return true;
  }
}
