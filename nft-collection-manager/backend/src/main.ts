import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { getAppConfig } from './config/app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const config = getAppConfig();
  
  // Enable CORS
  app.enableCors({
    origin: config.allowedOrigins.includes('*') ? true : config.allowedOrigins,
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
  // Must be before app.listen to ensure routes are registered correctly
  if (config.serveStatic) {
    const path = require('path');
    const express = require('express');
    const fs = require('fs');
    
    // Try multiple possible paths for frontend dist (Railway build locations)
    const possiblePaths = [
      path.join(__dirname, '../frontend/dist'),      // Relative to dist/
      path.join(__dirname, '../../frontend/dist'),   // Relative to dist/src/
      path.join(process.cwd(), 'frontend/dist'),     // From project root
      path.join(process.cwd(), '../frontend/dist'),  // From backend/ directory
    ];
    
    let staticPathFound = false;
    for (const staticPath of possiblePaths) {
      try {
        if (fs.existsSync(staticPath) && fs.existsSync(path.join(staticPath, 'index.html'))) {
          const expressApp = app.getHttpAdapter().getInstance();
          
          // Serve static files (CSS, JS, images, etc.)
          expressApp.use(express.static(staticPath, { index: false }));
          
          // Catch-all for SPA routing (must be after API routes)
          expressApp.get('*', (req: any, res: any, next: any) => {
            // Skip API routes and health check
            if (req.path.startsWith('/api') || req.path === '/health') {
              return next();
            }
            // Serve index.html for SPA routing
            res.sendFile(path.join(staticPath, 'index.html'));
          });
          
          console.log(`✅ Serving frontend from: ${staticPath}`);
          staticPathFound = true;
          break;
        }
      } catch (error) {
        // Continue to next path
      }
    }
    
    if (!staticPathFound) {
      console.warn('⚠️  SERVE_STATIC is enabled but frontend/dist not found. Frontend will not be served.');
    }
  }
  
  await app.listen(config.port);
  
  console.log(`🚀 NFT Collection Manager running on port ${config.port}`);
  console.log(`📊 API: http://localhost:${config.port}/api`);
  console.log(`🏥 Health: http://localhost:${config.port}/health`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  if (config.serveStatic) {
    console.log(`📦 Frontend: http://localhost:${config.port}/`);
  }
}

bootstrap();

