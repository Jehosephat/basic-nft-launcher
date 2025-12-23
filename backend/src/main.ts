import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { getAppConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const config = getAppConfig();
  
  // Enable CORS for frontend
  app.enableCors({
    origin: config.allowedOrigins,
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );
  
  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());
  
  // Global prefix
  app.setGlobalPrefix('api');
  
  // Serve static files if configured (for unified deployment)
  if (config.serveStatic) {
    const path = require('path');
    const express = require('express');
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    // Catch all handler for SPA routing
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    });
  }
  
  await app.listen(config.port);
  
  console.log(`🚀 NFT Collection Launcher Backend running on port ${config.port}`);
  console.log(`📊 API Documentation: http://localhost:${config.port}/api`);
  console.log(`🏥 Health Check: http://localhost:${config.port}/health`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
}

bootstrap();
