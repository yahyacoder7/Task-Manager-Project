import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const isProduction = process.env.NODE_ENV === 'production';

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableShutdownHooks();

  // ── CORS: restrict origins in production ────────────────────────────────
  // In production, only allow requests from your official frontend domain.
  // In development, allow all origins for convenience.
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [];

  app.enableCors({
    origin: isProduction
      ? (origin, callback) => {
          // Allow requests with no origin (mobile apps, curl, Postman)
          if (!origin) return callback(null, true);
          if (allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          return callback(new Error('Not allowed by CORS'), false);
        }
      : true, // Allow all origins in development
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ── Swagger: only available in development ──────────────────────────────
  // In production (NODE_ENV=production) Swagger is completely disabled.
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('To-Do Manager API')
      .setDescription('The API description for my Todo project')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    console.log(`📖 Swagger docs: http://localhost:${process.env.PORT ?? 3000}/api`);
  }

  await app.listen(process.env.PORT ?? 3000);

  if (isProduction) {
    console.log(`🚀 Server running in PRODUCTION mode on port ${process.env.PORT ?? 3000}`);
    console.log('🔒 Swagger is DISABLED');
  } else {
    console.log(`🛠️  Server running in DEVELOPMENT mode on port ${process.env.PORT ?? 3000}`);
  }
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
