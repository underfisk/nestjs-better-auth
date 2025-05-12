import { createParamDecorator, ExecutionContext, Inject } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import {
  BETTER_AUTH_INSTANCE_TOKEN,
  BEFORE_HOOK_KEY,
  AFTER_HOOK_KEY,
  HOOK_KEY,
  REQ_SESSION_KEY,
} from './constants';
import { BetterAuthUserSession } from './types';
import { BETTER_AUTH_MODULE_OPTIONS_CONFIG_KEY } from './better-auth-config.module';

export const InjectBetterAuth = () => Inject(BETTER_AUTH_INSTANCE_TOKEN);
export const InjectBetterAuthModuleOptions = () =>
  Inject(BETTER_AUTH_MODULE_OPTIONS_CONFIG_KEY);

type UserSessionType = keyof BetterAuthUserSession;

export const CurrentUserSession = createParamDecorator(
  (
    sessionAccessKey: UserSessionType | undefined,
    ctx: ExecutionContext,
  ): BetterAuthUserSession => {
    const request = ctx.switchToHttp().getRequest();

    // TODO: accept more context ype
    const session = request[REQ_SESSION_KEY];
    if (!session) {
      throw new Error('Session not found in request');
    }

    return sessionAccessKey ? session[sessionAccessKey] : session;
  },
);

/**
 * Registers a method to be executed before a specific auth route is processed.
 * @param path - The auth route path that triggers this hook (must start with '/')
 */
export const BeforeHook = (path: `/${string}`) =>
  SetMetadata(BEFORE_HOOK_KEY, path);

/**
 * Registers a method to be executed after a specific auth route is processed.
 * @param path - The auth route path that triggers this hook (must start with '/')
 */
export const AfterHook = (path: `/${string}`) =>
  SetMetadata(AFTER_HOOK_KEY, path);

/**
 * Class decorator that marks a provider as containing hook methods.
 * Must be applied to classes that use BeforeHook or AfterHook decorators.
 */
export const Hook = () => SetMetadata(HOOK_KEY, true);
