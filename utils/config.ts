import path from 'path';
import { config as loadEnv } from 'dotenv';

// Load .env from project root first, then web/.env (bot and web share env vars)
const root = path.resolve(__dirname, '..');
loadEnv({ path: path.join(root, '.env') });
loadEnv({ path: path.join(root, 'web', '.env') });

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  discordToken: getEnvVar('DISCORD_TOKEN'),
  databaseUrl: getEnvVar('DATABASE_URL', 'file:./prisma/dev.db'),
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  isProduction: process.env.NODE_ENV === 'production',
};
