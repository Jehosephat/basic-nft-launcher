export interface AppConfig {
  port: number;
  nodeEnv: string;
  allowedOrigins: string[];
  serveStatic: boolean;
  galachainApi: string;
}

export const getAppConfig = (): AppConfig => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  
  // In production, default to serving static files unless explicitly disabled
  // This means frontend and backend are on same origin, so CORS is not needed
  const serveStatic = process.env.SERVE_STATIC !== 'false' && isProduction;
  
  // Get allowed origins
  let allowedOrigins: string[];
  if (process.env.ALLOWED_ORIGINS) {
    // Explicitly set - use it
    allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
  } else if (serveStatic) {
    // Serving static files = same origin, allow all (CORS not really needed)
    // But set to wildcard to be safe for any edge cases
    allowedOrigins = ['*'];
  } else {
    // Development defaults or separate frontend service
    allowedOrigins = ['http://localhost:3000', 'http://localhost:5173'];
  }

  return {
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv,
    allowedOrigins,
    serveStatic,
    galachainApi: process.env.GALACHAIN_API || 'https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken',
  };
};

