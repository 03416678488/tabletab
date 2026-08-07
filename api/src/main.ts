import { join } from 'path';
import { AppModule } from './app.module';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { useContainer } from 'class-validator';
import { AppConstants } from '@cor/constants/app.constants';
import { CustomValidationPipe } from '@cor/pipes/validation.pipes';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix(AppConstants.ApiPrefix);

  // Raise the request body limit (default ~100kb) so bulk CSV imports — which
  // post the whole file as JSON text — aren't rejected as "payload too large".
  app.useBodyParser('json', { limit: '15mb' });
  app.useBodyParser('urlencoded', { limit: '15mb', extended: true });

  // Serve uploaded files: public/uploads/... is reachable at /uploads/...
  app.useStaticAssets(join(process.cwd(), 'public'));

  app.useGlobalPipes(CustomValidationPipe);

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Allowed origins: the configured frontend URLs, plus — in development only —
  // any localhost / private-LAN origin, so a phone on the same Wi-Fi (e.g.
  // scanning a table QR) can reach the API without hardcoding the machine's
  // current IP (which changes between networks). Production stays strict.
  const staticOrigins = [process.env.FRONTEND_URL, process.env.FRONTEND_URL_NETWORK].filter(
    (o): o is string => !!o,
  );
  const LAN_ORIGIN =
    /^https?:\/\/(localhost|127\.0\.0\.1|(?:10|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d+\.\d+)(?::\d+)?$/;
  app.enableCors({
    origin: (origin, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true); // same-origin / curl / server-to-server
      if (staticOrigins.includes(origin)) return callback(null, true);
      if (process.env.NODE_ENV !== 'production' && LAN_ORIGIN.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  });

  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(process.env.APP_PORT || 3003, '0.0.0.0');
  console.clear();
  console.log(`App URL: ${await app.getUrl()}`);
}

bootstrap();
