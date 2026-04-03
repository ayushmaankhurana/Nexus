import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from '@nexus/core'; // <-- 1. Import your validated config

// We store the instance globally to survive hot-reloads
let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    // 2. Just plug it straight in. No if-statements or error throws needed!
    const pool = new pg.Pool({ connectionString: config.databaseUrl });
    const adapter = new PrismaPg(pool);
    
    prismaInstance = new PrismaClient({ adapter });
    console.log('⚡️ Prisma Database Connection Established');
  }
  
  return prismaInstance;
}