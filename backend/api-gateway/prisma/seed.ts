import { PrismaClient, UserRole, AccountStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt'; // Add this import
import "dotenv/config";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seed...");

  await prisma.session.deleteMany();
  await prisma.account.deleteMany();

  // Hash the passwords before creating the records
  const saltRounds = 10;
  const hash123 = await bcrypt.hash('pass123', saltRounds);
  const hash456 = await bcrypt.hash('pass456', saltRounds);

  console.log("Creating Account: CS21001 (Pending)...");
  await prisma.account.create({
    data: {
      rollNumber: 'CS21001',
      email: 'cs21001@campus.edu',
      password: hash123, // Use the hash
      status: AccountStatus.PENDING,
      role: UserRole.STUDENT,
      activationToken: 'activation_token_001',
    },
  });

  console.log("Creating Account: CS21002 (Active)...");
  await prisma.account.create({
    data: {
      rollNumber: 'CS21002',
      email: 'cs21002@campus.edu',
      password: hash456, // Use the hash
      status: AccountStatus.ACTIVE,
      role: UserRole.STUDENT,
    },
  });

  console.log("✅ Seed completed successfully!");
}

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