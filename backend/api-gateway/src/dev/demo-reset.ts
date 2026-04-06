import {
  PrismaClient,
  UserRole,
  AccountStatus,
  AccessAction,
  AccessReason,
  AttendanceStatus,
  AttendanceMethod,
} from '@prisma/client';
import bcrypt from 'bcrypt';

export async function seedDemoDatabase(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Starting database seed...');

  await prisma.bleDetection.deleteMany();
  await prisma.presenceLocation.deleteMany();
  await prisma.accessEvent.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.studentGroupMembership.deleteMany();
  await prisma.facultyAssignment.deleteMany();
  await prisma.classSessionTemplate.deleteMany();
  await prisma.studentGroup.deleteMany();
  await prisma.section.deleteMany();
  await prisma.course.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.facultyProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.geofence.deleteMany();

  const saltRounds = 10;
  const commonPassword = await bcrypt.hash('pass123', saltRounds);
  const adminPassword = await bcrypt.hash('secure123', saltRounds);

  console.log('Creating accounts and profiles...');

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

  const meera = await prisma.account.create({
    data: {
      rollNumber: 'CS21005',
      email: 'cs21005@campus.edu',
      password: commonPassword,
      status: AccountStatus.ACTIVE,
      role: UserRole.STUDENT,
      profile: {
        create: {
          firstName: 'Meera',
          lastName: 'Joshi',
          rfidTag: 'RFID_E_005',
        },
      },
    },
  });

  const kabir = await prisma.account.create({
    data: {
      rollNumber: 'CS21006',
      email: 'cs21006@campus.edu',
      password: commonPassword,
      status: AccountStatus.ACTIVE,
      role: UserRole.STUDENT,
      profile: {
        create: {
          firstName: 'Kabir',
          lastName: 'Malhotra',
          rfidTag: 'RFID_F_006',
        },
      },
    },
  });

  await prisma.account.create({
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

  await prisma.account.create({
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

  const facultyAccount = await prisma.account.create({
    data: {
      rollNumber: 'FAC1001',
      email: 'faculty1@campus.edu',
      password: adminPassword,
      status: AccountStatus.ACTIVE,
      role: UserRole.FACULTY,
      facultyProfile: {
        create: {
          firstName: 'Dr. Neha',
          lastName: 'Kapoor',
          department: 'Computer Science',
          title: 'Associate Professor',
        },
      },
    },
  });

  console.log('Creating campus geofences...');

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

  await prisma.geofence.create({
    data: {
      name: 'CS Building',
      type: 'BUILDING',
      coordinates: { lat: 28.409, lng: 77.3181 },
      radius: 80.0,
    },
  });

  const cs101 = await prisma.geofence.create({
    data: {
      name: 'CS-101 Lecture Hall',
      type: 'CLASSROOM',
      coordinates: { lat: 28.409, lng: 77.318 },
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

  console.log('Creating timetable: courses, sections, groups...');

  const ds = await prisma.course.create({
    data: {
      code: 'CS201',
      title: 'Data Structures',
      department: 'Computer Science',
      credits: 4,
    },
  });

  const algo = await prisma.course.create({
    data: {
      code: 'CS202',
      title: 'Algorithms',
      department: 'Computer Science',
      credits: 3,
    },
  });

  const cs201A = await prisma.section.create({
    data: {
      courseId: ds.id,
      code: 'A',
      term: 'Spring',
      year: 2026,
    },
  });

  const cs202A = await prisma.section.create({
    data: {
      courseId: algo.id,
      code: 'A',
      term: 'Spring',
      year: 2026,
    },
  });

  const groupA1 = await prisma.studentGroup.create({
    data: {
      sectionId: cs201A.id,
      code: 'A1',
      name: 'Group 1',
    },
  });

  const groupA2 = await prisma.studentGroup.create({
    data: {
      sectionId: cs201A.id,
      code: 'A2',
      name: 'Group 2',
    },
  });

  await prisma.studentGroupMembership.createMany({
    data: [
      { groupId: groupA1.id, accountId: anjali.id },
      { groupId: groupA1.id, accountId: rohan.id },
      { groupId: groupA2.id, accountId: priya.id },
      { groupId: groupA2.id, accountId: meera.id },
      { groupId: groupA1.id, accountId: kabir.id },
    ],
  });

  await prisma.facultyAssignment.create({
    data: { facultyAccountId: facultyAccount.id, sectionId: cs201A.id, groupId: null },
  });

  await prisma.facultyAssignment.create({
    data: { facultyAccountId: facultyAccount.id, sectionId: cs202A.id, groupId: null },
  });

  const templateDsMon = await prisma.classSessionTemplate.create({
    data: {
      sectionId: cs201A.id,
      groupId: null,
      facultyAccountId: facultyAccount.id,
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:00',
      room: 'CS-101',
      geofenceId: cs101.id,
    },
  });

  const templateDsWed = await prisma.classSessionTemplate.create({
    data: {
      sectionId: cs201A.id,
      groupId: null,
      facultyAccountId: facultyAccount.id,
      dayOfWeek: 3,
      startTime: '09:00',
      endTime: '10:00',
      room: 'CS-101',
      geofenceId: cs101.id,
    },
  });

  const templateAlgoTue = await prisma.classSessionTemplate.create({
    data: {
      sectionId: cs202A.id,
      groupId: null,
      facultyAccountId: facultyAccount.id,
      dayOfWeek: 2,
      startTime: '11:00',
      endTime: '12:00',
      room: 'CS-102',
      geofenceId: cs102.id,
    },
  });

  console.log('Creating attendance history...');

  await prisma.attendanceRecord.createMany({
    data: [
      {
        accountId: anjali.id,
        classSessionTemplateId: templateDsMon.id,
        scheduledDate: new Date('2026-04-06T09:00:00Z'),
        timestamp: new Date('2026-04-06T09:02:00Z'),
        status: AttendanceStatus.PRESENT,
        method: AttendanceMethod.QR,
        qrToken: 'qr_tok_001',
        geofenceValidated: true,
      },
      {
        accountId: rohan.id,
        classSessionTemplateId: templateDsMon.id,
        scheduledDate: new Date('2026-04-06T09:00:00Z'),
        timestamp: new Date('2026-04-06T09:03:00Z'),
        status: AttendanceStatus.PRESENT,
        method: AttendanceMethod.QR,
        qrToken: 'qr_tok_001',
        geofenceValidated: true,
      },
      {
        accountId: priya.id,
        classSessionTemplateId: templateDsMon.id,
        scheduledDate: new Date('2026-04-06T09:00:00Z'),
        timestamp: new Date('2026-04-06T09:12:00Z'),
        status: AttendanceStatus.LATE,
        method: AttendanceMethod.QR,
        qrToken: 'qr_tok_001',
        geofenceValidated: true,
      },
      {
        accountId: anjali.id,
        classSessionTemplateId: templateAlgoTue.id,
        scheduledDate: new Date('2026-04-07T11:00:00Z'),
        timestamp: new Date('2026-04-07T11:01:00Z'),
        status: AttendanceStatus.PRESENT,
        method: AttendanceMethod.QR,
        qrToken: 'qr_tok_002',
        geofenceValidated: true,
      },
      {
        accountId: priya.id,
        classSessionTemplateId: templateDsWed.id,
        scheduledDate: new Date('2026-04-02T09:00:00Z'),
        timestamp: new Date('2026-04-02T09:00:00Z'),
        status: AttendanceStatus.ABSENT,
        method: AttendanceMethod.MANUAL,
        geofenceValidated: false,
        markedByFacultyId: facultyAccount.id,
      },
    ],
  });

  console.log('Creating access history...');

  await prisma.accessEvent.createMany({
    data: [
      {
        accountId: anjali.id,
        geofenceId: mainGate.id,
        action: AccessAction.ENTRY,
        reason: null,
        timestamp: new Date('2026-04-06T08:45:00Z'),
      },
      {
        accountId: anjali.id,
        geofenceId: cs101.id,
        action: AccessAction.ENTRY,
        reason: null,
        timestamp: new Date('2026-04-06T08:55:00Z'),
      },
      {
        accountId: anjali.id,
        geofenceId: mainGate.id,
        action: AccessAction.EXIT,
        reason: null,
        timestamp: new Date('2026-04-06T17:05:00Z'),
      },
      {
        accountId: rohan.id,
        geofenceId: backGate.id,
        action: AccessAction.ENTRY,
        reason: null,
        timestamp: new Date('2026-04-06T08:50:00Z'),
      },
      {
        accountId: priya.id,
        geofenceId: parkingA.id,
        action: AccessAction.DENIED,
        reason: AccessReason.UNAUTHORIZED_AREA,
        timestamp: new Date('2026-04-06T08:40:00Z'),
      },
      {
        accountId: priya.id,
        geofenceId: mainGate.id,
        action: AccessAction.ENTRY,
        reason: null,
        timestamp: new Date('2026-04-06T08:42:00Z'),
      },
      {
        accountId: rahul.id,
        geofenceId: mainGate.id,
        action: AccessAction.DENIED,
        reason: AccessReason.INACTIVE_ACCOUNT,
        timestamp: new Date('2026-04-06T08:35:00Z'),
      },
    ],
  });

  console.log('Creating presence history...');

  const now = Date.now();

  await prisma.presenceLocation.createMany({
    data: [
      {
        accountId: anjali.id,
        latitude: 28.40882,
        longitude: 77.31774,
        recordedAt: new Date(now - 70 * 60 * 1000),
      },
      {
        accountId: anjali.id,
        latitude: 28.40898,
        longitude: 77.31796,
        recordedAt: new Date(now - 45 * 60 * 1000),
      },
      {
        accountId: anjali.id,
        latitude: 28.40918,
        longitude: 77.31818,
        recordedAt: new Date(now - 26 * 60 * 1000),
      },
      {
        accountId: anjali.id,
        latitude: 28.40934,
        longitude: 77.31854,
        recordedAt: new Date(now - 8 * 60 * 1000),
      },
      {
        accountId: rohan.id,
        latitude: 28.40806,
        longitude: 77.31682,
        recordedAt: new Date(now - 55 * 60 * 1000),
      },
      {
        accountId: rohan.id,
        latitude: 28.40825,
        longitude: 77.31715,
        recordedAt: new Date(now - 28 * 60 * 1000),
      },
      {
        accountId: rohan.id,
        latitude: 28.40814,
        longitude: 77.31693,
        recordedAt: new Date(now - 11 * 60 * 1000),
      },
      {
        accountId: priya.id,
        latitude: 28.40835,
        longitude: 77.31712,
        recordedAt: new Date(now - 60 * 60 * 1000),
      },
      {
        accountId: priya.id,
        latitude: 28.40892,
        longitude: 77.31785,
        recordedAt: new Date(now - 24 * 60 * 1000),
      },
      {
        accountId: priya.id,
        latitude: 28.40902,
        longitude: 77.31803,
        recordedAt: new Date(now - 18 * 60 * 1000),
      },
      {
        accountId: meera.id,
        latitude: 28.40888,
        longitude: 77.31772,
        recordedAt: new Date(now - 90 * 60 * 1000),
      },
      {
        accountId: meera.id,
        latitude: 28.40901,
        longitude: 77.31809,
        recordedAt: new Date(now - 42 * 60 * 1000),
      },
      {
        accountId: meera.id,
        latitude: 28.40926,
        longitude: 77.31827,
        recordedAt: new Date(now - 14 * 60 * 1000),
      },
      {
        accountId: kabir.id,
        latitude: 28.40862,
        longitude: 77.31722,
        recordedAt: new Date(now - 105 * 60 * 1000),
      },
      {
        accountId: kabir.id,
        latitude: 28.40936,
        longitude: 77.31858,
        recordedAt: new Date(now - 48 * 60 * 1000),
      },
      {
        accountId: kabir.id,
        latitude: 28.40917,
        longitude: 77.31834,
        recordedAt: new Date(now - 22 * 60 * 1000),
      },
    ],
  });

  console.log('✅ Seed completed successfully!');
}