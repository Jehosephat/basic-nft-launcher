export interface AppConfig {
  port: number;
  nodeEnv: string;
  serveStatic: boolean;
  allowedOrigins: string[];
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
    ssl: boolean;
  };
  galachainApi: string;
}

export const getAppConfig = (): AppConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Auto-serve static files in production
    serveStatic: process.env.SERVE_STATIC !== 'false' && isProduction,
    
    // CORS: Allow all when serving static (same origin)
    allowedOrigins: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : (isProduction ? ['*'] : ['http://localhost:3000', 'http://localhost:5173']),
    
    // Database: Use Railway variables if available, else defaults
    database: {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      name: process.env.DATABASE_NAME || 'nft_collection',
      ssl: process.env.DATABASE_SSL === 'true',
    },
    
    // GalaChain API
    galachainApi: process.env.GALACHAIN_API || 
      'https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken',
  };
};

