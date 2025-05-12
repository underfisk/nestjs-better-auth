import { Provider } from '@nestjs/common';
import { BETTER_AUTH_INSTANCE_TOKEN } from './constants';
import { betterAuth } from 'better-auth';
import { BETTER_AUTH_MODULE_OPTIONS_CONFIG_KEY } from './better-auth-config.module';
import { BetterAuthModuleOptions } from './types';

export const betterAuthInstanceProvider: Provider = {
  provide: BETTER_AUTH_INSTANCE_TOKEN,
  useFactory: (options: BetterAuthModuleOptions) => {
    return betterAuth(options.betterAuthConfig);
  },
  inject: [BETTER_AUTH_MODULE_OPTIONS_CONFIG_KEY],
};
