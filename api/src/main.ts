// Initialize OpenTelemetry before any other imports
import './instrumentation';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    rawBody: true, // Enable raw body for webhook verification
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('LaunchKit AI API')
    .setDescription('Production-grade AI SaaS API with usage-based billing')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
      'jwt'
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: 'API Key (format: Bearer lk_live_pk_...)',
      },
      'api-key'
    )
    .addTag('Health', 'System health checks')
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Organizations', 'Organization management')
    .addTag('Members', 'Team member management')
    .addTag('API Keys', 'API key lifecycle')
    .addTag('Jobs', 'AI job processing')
    .addTag('Usage', 'Usage metering and analytics')
    .addTag('Billing', 'Stripe billing integration')
    .addTag('Webhooks', 'Outbound webhook management')
    .addTag('Audit', 'Audit log queries')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = parseInt(process.env.PORT || '8080', 10);
  
  console.log(`🔧 Starting server on port: ${port}`);
  console.log(`🔧 PORT env var: ${process.env.PORT}`);
  console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`🔧 RAILWAY_PUBLIC_DOMAIN: ${process.env.RAILWAY_PUBLIC_DOMAIN}`);
  
  await app.listen(port, '0.0.0.0');

  const isProduction = process.env.NODE_ENV === 'production';
  const host = isProduction 
    ? process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_STATIC_URL || 'production'
    : `http://localhost:${port}`;
  
  console.log(`🚀 LaunchKit API running on ${isProduction ? `https://${host}` : host}`);
  console.log(`📚 API Docs: ${isProduction ? `https://${host}` : host}/api/docs`);
  console.log(`✅ Server is listening on 0.0.0.0:${port}`);
}

bootstrap();

