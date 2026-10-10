export interface ApplicationConfiguration {
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
  database: { host: string; port: number; name: string; username: string; password: string; ssl: boolean };
}
export const APPLICATION_DEFAULTS = {
  port: 8083, apiPrefix: 'api/v1', databasePort: 5432,
  databaseHost: '127.0.0.1', databaseName: 'jewelry_commerce',
  corsOrigins: 'http://localhost:6100,http://localhost:3100',
} as const;
function portNumber(value: string | undefined, fallback: number): number {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) throw new Error('Invalid configured port');
  return parsed;
}
export function applicationConfiguration(environment: NodeJS.ProcessEnv = process.env): ApplicationConfiguration {
  return {
    port: portNumber(environment.PORT, APPLICATION_DEFAULTS.port),
    apiPrefix: environment.API_PREFIX?.trim().replace(/^\/+|\/+$/g, '') || APPLICATION_DEFAULTS.apiPrefix,
    corsOrigins: (environment.CORS_ORIGINS || APPLICATION_DEFAULTS.corsOrigins).split(',').map(origin => origin.trim()).filter(Boolean),
    database: {
      host: environment.DB_HOST?.trim() || APPLICATION_DEFAULTS.databaseHost,
      port: portNumber(environment.DB_PORT, APPLICATION_DEFAULTS.databasePort),
      name: environment.DB_NAME?.trim() || APPLICATION_DEFAULTS.databaseName,
      username: environment.DB_USER?.trim() || '',
      password: environment.DB_PASSWORD || '',
      ssl: environment.DB_SSL === 'true',
    },
  };
}
