// import { z } from 'zod';

// const configSchema = z.object({
//   port: z.number().default(3000),
//   nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
//   // Future: MongoDB, Redis URLs
// });

// export type Config = z.infer<typeof configSchema>;

// export function loadConfig(): Config {
//   return configSchema.parse({
//     port: parseInt(process.env.PORT || '3000', 10),
//     nodeEnv: process.env.NODE_ENV || 'development',
//   });
// }
import { z } from 'zod';
import 'dotenv/config'; // Ensure dotenv is loaded before we parse

// 1. Define the strict schema for your environment
const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().default(3000),
  databaseUrl: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),
  // Force a strong secret length, but allow a fallback ONLY in development
  jwtSecret: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  // 2. Parse the environment variables
  const parsed = configSchema.safeParse({
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    databaseUrl: process.env.DATABASE_URL,
    // Provide the dev fallback here at the source, never in the app logic
    jwtSecret: process.env.NODE_ENV === 'production' 
      ? process.env.JWT_SECRET 
      : process.env.JWT_SECRET || 'nexus_super_secret_dev_key_2026_minimum_32_chars!', 
  });

  // 3. Fail FAST with a readable error if anything is missing
  if (!parsed.success) {
    console.error('❌ CRITICAL: Invalid environment variables:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
  }

  return parsed.data;
}

// Export a singleton instance of the config
export const config = loadConfig();