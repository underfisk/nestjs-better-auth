import { Controller, Get, INestApplication } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { BetterAuthModule } from '../lib/better-auth.module';
import { BetterAuthGuard } from '../lib/better-auth.guard';
import { CurrentUserSession } from '../lib/better-auth-decorators';
import { BetterAuthUserSession } from '../lib/types';
import { request, spec } from 'pactum';
import { bearer } from 'better-auth/plugins';
import { createAuthClient } from 'better-auth/client';
import { FastifyAdapter } from '@nestjs/platform-fastify';

@Controller()
class DummyController {
  @Get('me')
  getMe(@CurrentUserSession('user') user: BetterAuthUserSession['user']) {
    return `Hello ${user.email} from authenticated route!`;
  }
}

const cases = [
  {
    adapter: ExpressAdapter,
    name: 'Express v5',
  },
  {
    adapter: FastifyAdapter,
    name: 'Fastify',
  },
] as const;

describe('HTTP Integration Tests', () => {
  describe.each(cases)('$name adapter', ({ adapter }) => {
    let app: INestApplication;
    let authClient: ReturnType<typeof createAuthClient>;

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        controllers: [DummyController],
        imports: [
          BetterAuthModule.forRoot({
            betterAuthConfig: {
              emailAndPassword: {
                enabled: true,
              },
              plugins: [bearer()],
            },
          }),
        ],
        providers: [
          {
            provide: 'APP_GUARD',
            useClass: BetterAuthGuard,
          },
        ],
      }).compile();

      app = moduleRef.createNestApplication(new adapter());
      await app.listen(0);

      const baseUrl = (await app.getUrl()).replace('[::1]', 'localhost');
      request.setBaseUrl(baseUrl);

      authClient = createAuthClient({
        baseURL: `${baseUrl}/api/auth`,
      });
    });

    afterAll(async () => {
      await app.close();
    });

    it('should sign up successfully', async () => {
      const { error, data } = await authClient.signUp.email({
        email: 'test@gmail.com',
        password: 'password',
        name: 'test user',
      });

      expect(error).toBeNull();
      expect(data!.token).toEqual(expect.any(String));
      expect(data!.user).toEqual(
        expect.objectContaining({
          email: 'test@gmail.com',
          name: 'test user',
        }),
      );
    });

    it('should return 401 on GET /me', async () => {
      await spec().get('/me').expectStatus(401);
    });

    it('should return 200 on GET /me', async () => {
      const bearerToken = await new Promise<string>((resolve, reject) => {
        return authClient.signIn.email(
          {
            email: 'test@gmail.com',
            password: 'password',
          },
          {
            onSuccess: async (ctx) => {
              const authToken = ctx.response.headers.get('set-auth-token');
              if (!authToken) {
                reject(new Error('No auth token found'));
                return;
              }
              resolve(authToken);
            },
          },
        );
      });

      await spec()
        .get('/me')
        .withBearerToken(bearerToken)
        .expectStatus(200)
        .expectBody(`Hello test@gmail.com from authenticated route!`);
    });
  });
});
