import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from '@nexus/core';

// We store the instance globally to survive hot-reloads
let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    // --- FIX: SAFE DATABASE URL HANDLING ---
    // Pehle .env check karega, agar nahi mila toh config check karega
    const dbUrl = process.env.DATABASE_URL || (config && (config as any).databaseUrl);

    if (!dbUrl) {
      throw new Error('CRITICAL: DATABASE_URL is missing in .env or config. Server aborting.');
    }

    // Ab Pool create karo safely
    const pool = new pg.Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);
    
    prismaInstance = new PrismaClient({ adapter });
    console.log('⚡️ Prisma Database Connection Established');
  }
  
  return prismaInstance;
}