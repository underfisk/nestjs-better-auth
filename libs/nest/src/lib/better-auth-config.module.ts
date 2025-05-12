import { ConfigurableModuleBuilder } from '@nestjs/common';
import { BetterAuthModuleOptions } from './types';

export const {
  ConfigurableModuleClass: BetterAuthConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: BETTER_AUTH_MODULE_OPTIONS_CONFIG_KEY,
} = new ConfigurableModuleBuilder<BetterAuthModuleOptions>()
  .setClassMethodName('forRoot')
  .build();
