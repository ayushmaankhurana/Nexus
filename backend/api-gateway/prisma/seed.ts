// import { PrismaClient, UserRole, AccountStatus } from '@prisma/client';
// import { PrismaPg } from '@prisma/adapter-pg';
// import pg from 'pg';
// import bcrypt from 'bcrypt'; // Add this import
// import "dotenv/config";

// const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
// const adapter = new PrismaPg(pool);
// const prisma = new PrismaClient({ adapter });

// async function main() {
//   console.log("🌱 Starting database seed...");

//   await prisma.session.deleteMany();
//   await prisma.account.deleteMany();

//   // Hash the passwords before creating the records
//   const saltRounds = 10;
//   const hash123 = await bcrypt.hash('pass123', saltRounds);
//   const hash456 = await bcrypt.hash('pass456', saltRounds);

//   console.log("Creating Account: CS21001 (Pending)...");
//   await prisma.account.create({
//     data: {
//       rollNumber: 'CS21001',
//       email: 'cs21001@campus.edu',
//       password: hash123, // Use the hash
//       status: AccountStatus.PENDING,
//       role: UserRole.STUDENT,
//       activationToken: 'activation_token_001',
//     },
//   });

//   console.log("Creating Account: CS21002 (Active)...");
//   await prisma.account.create({
//     data: {
//       rollNumber: 'CS21002',
//       email: 'cs21002@campus.edu',
//       password: hash456, // Use the hash
//       status: AccountStatus.ACTIVE,
//       role: UserRole.STUDENT,
//     },
//   });

//   console.log("✅ Seed completed successfully!");
// }

// main()
//   .then(async () => {
//     await prisma.$disconnect();
//     await pool.end();
//     process.exit(0);
//   })
//   .catch(async (e) => {
//     console.error("❌ Seed failed with error:", e);
//     await prisma.$disconnect();
//     await pool.end();
//     process.exit(1);
//   });

import { PrismaClient, UserRole, AccountStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';
import "dotenv/config";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seed...");

  // 1. Clean up in reverse dependency order to prevent foreign key crashes
  await prisma.accessEvent.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.geofence.deleteMany();

  const saltRounds = 10;
  const hash123 = await bcrypt.hash('pass123', saltRounds);
  const hash456 = await bcrypt.hash('pass456', saltRounds);

  // 2. Create the Pending Account + Profile
  console.log("Creating Account & Profile: CS21001 (Pending)...");
  await prisma.account.create({
    data: {
      rollNumber: 'CS21001',
      email: 'cs21001@campus.edu',
      password: hash123,
      status: AccountStatus.PENDING,
      role: UserRole.STUDENT,
      activationToken: 'activation_token_001',
      profile: {
        create: {
          firstName: 'Rahul', // Replaced with a real name
          lastName: 'Sharma',
          rfidTag: 'RFID_A_001'
        }
      }
    },
  });

  // 3. Create the Active Account + Profile
  console.log("Creating Account & Profile: CS21002 (Active)...");
  const activeAccount = await prisma.account.create({
    data: {
      rollNumber: 'CS21002',
      email: 'cs21002@campus.edu',
      password: hash456,
      status: AccountStatus.ACTIVE,
      role: UserRole.STUDENT,
      profile: {
        create: {
          firstName: 'Anjali',
          lastName: 'Verma',
          rfidTag: 'RFID_B_002'
        }
      }
    },
  });

  // 4. Create Campus Geofences (Person 4 will use these)
  console.log("Creating Campus Geofences...");
  const mainGate = await prisma.geofence.create({
    data: {
      name: 'Main Campus Gate',
      type: 'BUILDING',
      coordinates: { lat: 28.4089, lng: 77.3178 }, // Dummy coordinates
      radius: 50.0
    }
  });

  await prisma.geofence.create({
    data: {
      name: 'CS-101 Lecture Hall',
      type: 'CLASSROOM',
      coordinates: { lat: 28.4090, lng: 77.3180 },
      radius: 15.0
    }
  });

  // 5. Create some sample history for the active student
  console.log("Creating sample Attendance & Access history...");
  await prisma.attendanceRecord.create({
    data: {
      accountId: activeAccount.id,
      classId: 'CS-101',
      status: 'PRESENT',
    }
  });

  await prisma.accessEvent.create({
    data: {
      accountId: activeAccount.id,
      geofenceId: mainGate.id,
      action: 'ENTRY',
    }
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