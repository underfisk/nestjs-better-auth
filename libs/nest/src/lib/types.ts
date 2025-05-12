import { getSession } from 'better-auth/api';
import { BetterAuthOptions } from 'better-auth/types';

export type BetterAuthUserSession = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getSession>>>
>;

export type BetterAuthModuleOptions = {
  betterAuthConfig: BetterAuthOptions;

  /**
   * The metadata key used to skip authentication for specific routes.
   * This is useful for public routes that don't require authentication.
   * By default, all routes are protected once the guard is applied.
   */
  skipAuthDecoratorMetadataKey?: string | symbol;
};
