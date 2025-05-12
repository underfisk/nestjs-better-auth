# Nestjs Better Auth Module

A [better-auth](https://www.better-auth.com/) Nestjs module that supports Fastify and Express v5 http-adapters out of the box.

### Getting Started

#### Installing the library

```sh
pnpm i nestjs-better-auth
```

### HTTP Adapters Support

This module supports two HTTP adapters out of the box:

- **Express v5**

  - [Better Auth Integration guide for Express](https://www.better-auth.com/docs/integrations/express)
  - Default adapter for NestJS applications

- **Fastify**
  - [Better Auth Integration guide for Fastify](https://www.better-auth.com/docs/integrations/fastify)
  - Higher performance alternative

Please refer to the respective integration guides for detailed setup instructions.

#### Consuming `BetterAuthModule`

Simply register the module in your `AppModule` (or your feature)

```typescript
import { Module } from '@nestjs/common';
import { BetterAuthModule } from 'nestjs-better-auth';

@Module({
  imports: [
    BetterAuthModule.forRoot({
      betterAuthConfig: {
        emailAndPassword: {
          enabled: true,
        },
      },
    }),
  ],
})
class AppModule {}
```

You can also leverage `forRootAsync` if you need to inject any configuration/third-party value to build your config.

#### Authentication Guard / Protecting your routes

This library exposes a `BetterAuthGuard` to protect authenticated routes. To use it globally for all routes, register it as follows:

```typescript
import { Module } from '@nestjs/common';
import { BetterAuthModule, BetterAuthGuard } from 'nestjs-better-auth';

@Module({
  imports: [
    BetterAuthModule.forRoot({
      betterAuthConfig: {
        emailAndPassword: {
          enabled: true,
        },
        // ...your configuration
      },
    }),
  ],
  providers: [
    {
      provide: 'APP_GUARD',
      useClass: BetterAuthGuard,
    },
  ],
})
class AppModule {}
```

Some routes should be publicly accessible without session validation. You can provide a decorator token to the module to specify which routes should skip authentication.
Alternatively, you can create your own Auth guard or apply the existing one manually to specific controllers or routes.

Example:

```typescript
import { Controller, Get, SetMetadata, Module } from '@nestjs/common';

const PublicRouteToken = Symbol('publicRoute');
const IsPublic = () => SetMetadata(PublicRouteToken, true);

@Controller()
class MyController {
  @IsPublic()
  @Get()
  publicRoute() {}

  @Get()
  authenticatedRoute() {}
}

@Module({
  imports: [
    BetterAuthModule.forRoot({
      skipAuthDecoratorMetadataKey: PublicRouteToken,
      betterAuthConfig: {
        emailAndPassword: {
          enabled: true,
        },
      },
    }),
  ],
  providers: [
    {
      provide: 'APP_GUARD',
      useClass: BetterAuthGuard,
    },
  ],
})
class AppModule {}
```

### Why not full ESM?

We're maintaining **CommonJS** compatibility as many existing applications still use CJS. While we plan to transition to ESM in the future, this approach ensures broader compatibility for now.

### HOOKS

WIP

### Contributing

We welcome contributions to improve nestjs-better-auth! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure you follow our coding standards and include appropriate tests for new features.
