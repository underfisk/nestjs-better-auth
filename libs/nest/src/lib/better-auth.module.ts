import {
  Global,
  Inject,
  Logger,
  Module,
  NestModule,
  OnModuleInit,
} from '@nestjs/common';
import {
  DiscoveryModule,
  DiscoveryService,
  HttpAdapterHost,
} from '@nestjs/core';
import { Auth } from 'better-auth';
import {
  BETTER_AUTH_MODULE_OPTIONS_CONFIG_KEY,
  BetterAuthConfigurableModuleClass,
} from './better-auth-config.module';

import { createAuthMiddleware } from 'better-auth/api';
import { InjectBetterAuth } from './better-auth-decorators';
import {
  BEFORE_HOOK_KEY,
  AFTER_HOOK_KEY,
  BETTER_AUTH_INSTANCE_TOKEN,
  HOOK_KEY,
} from './constants';
import { betterAuthInstanceProvider } from './better-auth-instance.provider';

const HOOKS = [
  { metadataKey: BEFORE_HOOK_KEY, hookType: 'before' as const },
  { metadataKey: AFTER_HOOK_KEY, hookType: 'after' as const },
];

const supportedTypes = ['express', 'fastify'];

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [betterAuthInstanceProvider],
  exports: [BETTER_AUTH_INSTANCE_TOKEN, BETTER_AUTH_MODULE_OPTIONS_CONFIG_KEY],
})
export class BetterAuthModule
  extends BetterAuthConfigurableModuleClass
  implements OnModuleInit, NestModule
{
  private readonly logger = new Logger(BetterAuthModule.name);

  constructor(
    @InjectBetterAuth()
    private readonly auth: Auth,
    @Inject(HttpAdapterHost)
    private readonly adapter: HttpAdapterHost,
    @Inject(DiscoveryService)
    private readonly discoveryService: DiscoveryService,
  ) {
    super();
  }

  onModuleInit() {
    // TODO: review the hooks setup
    if (!this.auth.options.hooks) return;

    const providers = this.discoveryService
      .getProviders()
      .filter(
        ({ metatype }) => metatype && Reflect.getMetadata(HOOK_KEY, metatype),
      );

    for (const provider of providers) {
      const providerPrototype = Object.getPrototypeOf(provider.instance);
      const methods = this.metadataScanner.getAllMethodNames(providerPrototype);

      for (const method of methods) {
        const providerMethod = providerPrototype[method];
        this.setupHooks(providerMethod);
      }
    }
  }

  private setupHooks(providerMethod: (ctx: any) => Promise<void>) {
    if (!this.auth.options.hooks) return;

    for (const { metadataKey, hookType } of HOOKS) {
      const hookPath = Reflect.getMetadata(metadataKey, providerMethod);
      if (!hookPath) continue;

      const originalHook = this.auth.options.hooks[hookType];
      this.auth.options.hooks[hookType] = createAuthMiddleware(async (ctx) => {
        if (originalHook) {
          await originalHook(ctx);
        }

        if (hookPath === ctx.path) {
          await providerMethod(ctx);
        }
      });
    }
  }

  private getBasePath(type: string): string {
    let basePath = this.auth.options.basePath ?? '/api/auth';

    // Ensure the basePath starts with / and doesn't end with /
    if (!basePath.startsWith('/')) {
      basePath = '/' + basePath;
    }
    if (basePath.endsWith('/')) {
      basePath = basePath.slice(0, -1);
    }

    return `${basePath}${type === 'express' ? '/*splat' : '/*'}`;
  }

  configure() {
    const type = this.adapter.httpAdapter.getType();

    if (!supportedTypes.includes(type)) {
      throw new Error(
        `BetterAuthModule does not support ${type} adapter. Supported types are: ${supportedTypes.join(
          ', ',
        )}`,
      );
    }

    this.adapter.httpAdapter
      .getInstance()
      .all(this.getBasePath(type), async (request: any, reply: any) => {
        try {
          const url = new URL(
            request.url,
            `${request.protocol}://${request.hostname}`,
          );

          const headers = new Headers();

          Object.entries(request.headers).forEach(([key, value]) => {
            if (value) headers.append(key, value.toString());
          });

          const req = new Request(url.toString(), {
            method: request.method,
            headers,
            body: request.body ? JSON.stringify(request.body) : undefined,
          });

          const response = await this.auth.handler(req);
          reply.status(response.status);
          response.headers.forEach((value, key) => reply.header(key, value));
          reply.send(response.body ? await response.text() : null);
        } catch (error) {
          this.logger.fatal(error);
          reply.status(500).send({
            error: 'Internal authentication error',
            code: 'AUTH_FAILURE',
          });
        }
      });

    this.logger.log('Middleware configured.');
  }
}
