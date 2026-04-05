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

  await prisma.accessEvent.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.geofence.deleteMany();

  const saltRounds = 10;
  const commonPassword = await bcrypt.hash('pass123', saltRounds);
  const adminPassword = await bcrypt.hash('secure123', saltRounds);

  console.log("Creating accounts and profiles...");

  const rahul = await prisma.account.create({
    data: {
      rollNumber: 'CS21001',
      email: 'cs21001@campus.edu',
      password: commonPassword,
      status: AccountStatus.PENDING,
      role: UserRole.STUDENT,
      activationToken: 'activation_token_001',
      profile: {
        create: {
          firstName: 'Rahul',
          lastName: 'Sharma',
          rfidTag: 'RFID_A_001',
        },
      },
    },
  });

  const anjali = await prisma.account.create({
    data: {
      rollNumber: 'CS21002',
      email: 'cs21002@campus.edu',
      password: commonPassword,
      status: AccountStatus.ACTIVE,
      role: UserRole.STUDENT,
      profile: {
        create: {
          firstName: 'Anjali',
          lastName: 'Verma',
          rfidTag: 'RFID_B_002',
        },
      },
    },
  });

  const rohan = await prisma.account.create({
    data: {
      rollNumber: 'CS21003',
      email: 'cs21003@campus.edu',
      password: commonPassword,
      status: AccountStatus.ACTIVE,
      role: UserRole.STUDENT,
      profile: {
        create: {
          firstName: 'Rohan',
          lastName: 'Mehta',
          rfidTag: 'RFID_C_003',
        },
      },
    },
  });

  const priya = await prisma.account.create({
    data: {
      rollNumber: 'CS21004',
      email: 'cs21004@campus.edu',
      password: commonPassword,
      status: AccountStatus.ACTIVE,
      role: UserRole.STUDENT,
      profile: {
        create: {
          firstName: 'Priya',
          lastName: 'Nair',
          rfidTag: 'RFID_D_004',
        },
      },
    },
  });

  const securityUser = await prisma.account.create({
    data: {
      rollNumber: 'SEC1001',
      email: 'security1@campus.edu',
      password: adminPassword,
      status: AccountStatus.ACTIVE,
      role: UserRole.SECURITY,
      profile: {
        create: {
          firstName: 'Vikram',
          lastName: 'Singh',
          rfidTag: 'RFID_SEC_001',
        },
      },
    },
  });

    const adminUser = await prisma.account.create({
    data: {
      rollNumber: 'ADM1001',
      email: 'admin1@campus.edu',
      password: adminPassword,
      status: AccountStatus.ACTIVE,
      role: UserRole.ADMIN,
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          rfidTag: 'RFID_ADMIN_001',
        },
      },
    },
  });

  console.log("Creating campus geofences...");

  const mainGate = await prisma.geofence.create({
    data: {
      name: 'Main Campus Gate',
      type: 'GATE',
      coordinates: { lat: 28.4089, lng: 77.3178 },
      radius: 50.0,
    },
  });

  const backGate = await prisma.geofence.create({
    data: {
      name: 'Back Campus Gate',
      type: 'GATE',
      coordinates: { lat: 28.4081, lng: 77.3169 },
      radius: 45.0,
    },
  });

  const cs101 = await prisma.geofence.create({
    data: {
      name: 'CS-101 Lecture Hall',
      type: 'CLASSROOM',
      coordinates: { lat: 28.4090, lng: 77.3180 },
      radius: 15.0,
    },
  });

  const cs102 = await prisma.geofence.create({
    data: {
      name: 'CS-102 Lecture Hall',
      type: 'CLASSROOM',
      coordinates: { lat: 28.4092, lng: 77.3183 },
      radius: 15.0,
    },
  });

  const cs103 = await prisma.geofence.create({
    data: {
      name: 'CS-103 Lab',
      type: 'CLASSROOM',
      coordinates: { lat: 28.4094, lng: 77.3186 },
      radius: 18.0,
    },
  });

  const parkingA = await prisma.geofence.create({
    data: {
      name: 'Parking Zone A',
      type: 'PARKING',
      coordinates: { lat: 28.4084, lng: 77.3171 },
      radius: 35.0,
    },
  });

  console.log("Creating attendance history...");

  await prisma.attendanceRecord.createMany({
    data: [
      {
        accountId: anjali.id,
        classId: 'CS-101',
        status: 'PRESENT',
        timestamp: new Date('2026-04-01T09:00:00Z'),
      },
      {
        accountId: anjali.id,
        classId: 'CS-102',
        status: 'LATE',
        timestamp: new Date('2026-04-02T09:07:00Z'),
      },
      {
        accountId: rohan.id,
        classId: 'CS-101',
        status: 'PRESENT',
        timestamp: new Date('2026-04-01T09:01:00Z'),
      },
      {
        accountId: priya.id,
        classId: 'CS-103',
        status: 'ABSENT',
        timestamp: new Date('2026-04-03T10:00:00Z'),
      },
      {
        accountId: priya.id,
        classId: 'CS-102',
        status: 'PRESENT',
        timestamp: new Date('2026-04-04T09:00:00Z'),
      },
    ],
  });

  console.log("Creating access history...");

  await prisma.accessEvent.createMany({
    data: [
      {
        accountId: anjali.id,
        geofenceId: mainGate.id,
        action: 'ENTRY',
        reason: null,
        timestamp: new Date('2026-04-01T08:45:00Z'),
      },
      {
        accountId: anjali.id,
        geofenceId: cs101.id,
        action: 'ENTRY',
        reason: null,
        timestamp: new Date('2026-04-01T08:55:00Z'),
      },
      {
        accountId: rohan.id,
        geofenceId: backGate.id,
        action: 'ENTRY',
        reason: null,
        timestamp: new Date('2026-04-02T08:50:00Z'),
      },
      {
        accountId: priya.id,
        geofenceId: parkingA.id,
        action: 'DENIED',
        reason: 'Parking entitlement missing',
        timestamp: new Date('2026-04-03T08:40:00Z'),
      },
      {
        accountId: priya.id,
        geofenceId: mainGate.id,
        action: 'ENTRY',
        reason: null,
        timestamp: new Date('2026-04-03T08:42:00Z'),
      },
    ],
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

// import { PrismaClient, UserRole, AccountStatus } from '@prisma/client';
// import { PrismaPg } from '@prisma/adapter-pg';
// import pg from 'pg';
// import bcrypt from 'bcrypt';
// import "dotenv/config";

// const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
// const adapter = new PrismaPg(pool);
// const prisma = new PrismaClient({ adapter });

// async function main() {
//   console.log("🌱 Starting database seed...");

//   // 1. Clean up in reverse dependency order to prevent foreign key crashes
//   await prisma.accessEvent.deleteMany();
//   await prisma.attendanceRecord.deleteMany();
//   await prisma.studentProfile.deleteMany();
//   await prisma.session.deleteMany();
//   await prisma.account.deleteMany();
//   await prisma.geofence.deleteMany();

//   const saltRounds = 10;
//   const hash123 = await bcrypt.hash('pass123', saltRounds);
//   const hash456 = await bcrypt.hash('pass456', saltRounds);

//   // 2. Create the Pending Account + Profile
//   console.log("Creating Account & Profile: CS21001 (Pending)...");
//   await prisma.account.create({
//     data: {
//       rollNumber: 'CS21001',
//       email: 'cs21001@campus.edu',
//       password: hash123,
//       status: AccountStatus.PENDING,
//       role: UserRole.STUDENT,
//       activationToken: 'activation_token_001',
//       profile: {
//         create: {
//           firstName: 'Rahul', // Replaced with a real name
//           lastName: 'Sharma',
//           rfidTag: 'RFID_A_001'
//         }
//       }
//     },
//   });

//   // 3. Create the Active Account + Profile
//   console.log("Creating Account & Profile: CS21002 (Active)...");
//   const activeAccount = await prisma.account.create({
//     data: {
//       rollNumber: 'CS21002',
//       email: 'cs21002@campus.edu',
//       password: hash456,
//       status: AccountStatus.ACTIVE,
//       role: UserRole.STUDENT,
//       profile: {
//         create: {
//           firstName: 'Anjali',
//           lastName: 'Verma',
//           rfidTag: 'RFID_B_002'
//         }
//       }
//     },
//   });

//   // 4. Create Campus Geofences (Person 4 will use these)
//   console.log("Creating Campus Geofences...");
//   const mainGate = await prisma.geofence.create({
//     data: {
//       name: 'Main Campus Gate',
//       type: 'BUILDING',
//       coordinates: { lat: 28.4089, lng: 77.3178 }, // Dummy coordinates
//       radius: 50.0
//     }
//   });

//   await prisma.geofence.create({
//     data: {
//       name: 'CS-101 Lecture Hall',
//       type: 'CLASSROOM',
//       coordinates: { lat: 28.4090, lng: 77.3180 },
//       radius: 15.0
//     }
//   });

//   // 5. Create some sample history for the active student
//   console.log("Creating sample Attendance & Access history...");
//   await prisma.attendanceRecord.create({
//     data: {
//       accountId: activeAccount.id,
//       classId: 'CS-101',
//       status: 'PRESENT',
//     }
//   });

//   await prisma.accessEvent.create({
//     data: {
//       accountId: activeAccount.id,
//       geofenceId: mainGate.id,
//       action: 'ENTRY',
//     }
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