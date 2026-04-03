import { PrismaClient, UserRole, AccountStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import "dotenv/config";

// 1. Setup the Connection Pool & Adapter for Prisma 7
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seed...");

  // 2. Clean existing data (Avoids unique constraint errors on re-runs)
  console.log("Cleaning up old sessions and accounts...");
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();

  // 3. Create CS21001 (The Pending Account)
  console.log("Creating Account: CS21001 (Pending)...");
  await prisma.account.create({
    data: {
      rollNumber: 'CS21001',
      email: 'cs21001@campus.edu',
      password: 'pass123', 
      status: AccountStatus.PENDING,
      role: UserRole.STUDENT,
      activationToken: 'activation_token_001',
    },
  });

  // 4. Create CS21002 (The Active Account)
  console.log("Creating Account: CS21002 (Active)...");
  await prisma.account.create({
    data: {
      rollNumber: 'CS21002',
      email: 'cs21002@campus.edu',
      password: 'pass456',
      status: AccountStatus.ACTIVE,
      role: UserRole.STUDENT,
    },
  });

  console.log("✅ Seed completed successfully!");
}

// 5. Execution & Error Handling
main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("❌ Seed failed with error:", e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });