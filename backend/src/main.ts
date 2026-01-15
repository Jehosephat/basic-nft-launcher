import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));
  
  // Global prefix
  app.setGlobalPrefix('api');
  
  // Enable CORS - allow all origins in production since frontend is served from same origin
  // For Railway, we can use RAILWAY_PUBLIC_DOMAIN or allow all
  const corsOrigins = process.env.NODE_ENV === 'production'
    ? (process.env.RAILWAY_PUBLIC_DOMAIN 
        ? [`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`, `http://${process.env.RAILWAY_PUBLIC_DOMAIN}`]
        : '*')
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];
  
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });
  
  const port = process.env.PORT || 4000;
  
  // Serve static files from frontend dist in production
  if (process.env.NODE_ENV === 'production') {
    const frontendPath = join(__dirname, '..', 'frontend-dist');
    
    // Check if frontend dist exists
    const fs = require('fs');
    if (fs.existsSync(frontendPath)) {
      // Serve static assets (JS, CSS, images, etc.)
      app.useStaticAssets(frontendPath, {
        prefix: '/',
      });
      
      // SPA fallback - serve index.html for all non-API routes
      // This must be registered after static assets but before listen
      const express = app.getHttpAdapter().getInstance();
      express.get('*', (req, res, next) => {
        // Skip API routes - NestJS handles them via the /api prefix
        if (req.url.startsWith('/api')) {
          return next();
        }
        // Serve index.html for SPA routing
        res.sendFile(join(frontendPath, 'index.html'));
      });
      
      console.log(`🌐 Serving frontend from: ${frontendPath}`);
    } else {
      console.warn(`⚠️  Frontend dist not found at ${frontendPath}. Frontend will not be served.`);
    }
  }
  
  await app.listen(port);
  
  console.log(`🚀 NFT Collection Launcher Backend running on http://localhost:${port}`);
  console.log(`📊 API Documentation: http://localhost:${port}/api`);
}

bootstrap();
