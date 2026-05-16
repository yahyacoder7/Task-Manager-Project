import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();
  // Allow CORS for Expo Web and other local dev origins
  app.enableCors({
    origin: true, // allow all origins in development
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  // here we define the config of swagger
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('To-Do Manager API') // اسم المشروع
      .setDescription('The API description for my Todo project') // وصف بسيط
      .setVersion('1.0') // إصدار النسخة
      .addBearerAuth() // إذا كنت تستخدم JWT (اختياري)
      .build();

    // here we create the document of swagger
    const document = SwaggerModule.createDocument(app, config);

    // here we put the  url of swagger for Swagger UI
    SwaggerModule.setup('api', app, document);
  }
  await app.listen(process.env.PORT ?? 3000);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
