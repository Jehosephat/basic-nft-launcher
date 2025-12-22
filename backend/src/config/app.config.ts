export interface AppConfig {
  port: number;
  nodeEnv: string;
  allowedOrigins: string[];
  serveStatic: boolean;
  galachainApi: string;
}

export const getAppConfig = (): AppConfig => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173'];

  return {
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    allowedOrigins,
    serveStatic: process.env.SERVE_STATIC === 'true',
    galachainApi: process.env.GALACHAIN_API || 'https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken',
  };
};

