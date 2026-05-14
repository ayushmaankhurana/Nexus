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

const FIRST = [
  'Aarav', 'Aditya', 'Akash', 'Amit', 'Ananya', 'Arjun', 'Aryan', 'Ayush',
  'Deepak', 'Divya', 'Gaurav', 'Harsh', 'Ishaan', 'Ishita', 'Karan', 'Kavya',
  'Kriti', 'Lakshmi', 'Manish', 'Meghna', 'Mohit', 'Naina', 'Neha', 'Nikhil',
  'Nisha', 'Pallavi', 'Parth', 'Pooja', 'Raj', 'Rajesh', 'Ravi', 'Ritika',
  'Sakshi', 'Sanjay', 'Shreya', 'Shubham', 'Sneha', 'Suresh', 'Tanvi', 'Varun',
];

const LAST = [
  'Agarwal', 'Bhatia', 'Chauhan', 'Chawla', 'Desai', 'Dubey', 'Ghosh', 'Gupta',
  'Iyer', 'Jain', 'Joshi', 'Kapoor', 'Khan', 'Kumar', 'Malhotra', 'Mehta',
  'Mishra', 'Nair', 'Patel', 'Pillai', 'Rao', 'Reddy', 'Saxena', 'Shah',
  'Sharma', 'Shukla', 'Singh', 'Sinha', 'Srivastava', 'Tiwari', 'Varma', 'Verma',
  'Yadav', 'Mehra', 'Bose',
];

function pick<T>(arr: T[], seed: number): T {
  return arr[((seed * 2654435761) >>> 0) % arr.length];
}

function jitter(base: number, delta: number, seed: number): number {
  const h = ((seed * 1664525 + 1013904223) >>> 0) / 4294967295;
  return base + (h - 0.5) * 2 * delta;
}

// Returns the attendance status for a given student index and session index.
// Returns null for CS21001 (PENDING) and for absent sessions that have no record.
// Named demo students (indices 0-5) have explicit, story-ready patterns.
// Bulk students use a deterministic dice roll for varied realistic rates.
function getAttendanceStatus(studentIdx: number, sessionIdx: number): AttendanceStatus | null {
  if (studentIdx === 0) return null; // CS21001 PENDING — skip all sessions

  const namedPatterns: Array<Array<AttendanceStatus | null>> = [
    // index 0: CS21001 (Rahul, PENDING) — handled above
    [null, null, null, null, null, null, null, null],
    // index 1: CS21002 Anjali — 7/8 present → 87.5% (above threshold)
    [AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT,
     AttendanceStatus.ABSENT,  AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT],
    // index 2: CS21003 Rohan — 5/8 → 62.5% (BELOW THRESHOLD, flagged)
    [AttendanceStatus.PRESENT, AttendanceStatus.ABSENT,  AttendanceStatus.PRESENT, AttendanceStatus.ABSENT,
     AttendanceStatus.LATE,    AttendanceStatus.PRESENT, AttendanceStatus.ABSENT,  AttendanceStatus.PRESENT],
    // index 3: CS21004 Priya — 4/8 → 50% (WELL BELOW, flagged)
    [AttendanceStatus.ABSENT,  AttendanceStatus.PRESENT, AttendanceStatus.ABSENT,  AttendanceStatus.LATE,
     AttendanceStatus.PRESENT, AttendanceStatus.ABSENT,  AttendanceStatus.PRESENT, AttendanceStatus.ABSENT],
    // index 4: CS21005 Meera — 8/8 → 100% (perfect attendance)
    [AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT,
     AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT],
    // index 5: CS21006 Kabir — 5/8 → 62.5% (BELOW THRESHOLD, 1 late)
    [AttendanceStatus.PRESENT, AttendanceStatus.LATE,    AttendanceStatus.ABSENT,  AttendanceStatus.PRESENT,
     AttendanceStatus.PRESENT, AttendanceStatus.ABSENT,  AttendanceStatus.PRESENT, AttendanceStatus.ABSENT],
  ];

  if (studentIdx < 6) {
    return namedPatterns[studentIdx][sessionIdx];
  }

  const dice = ((studentIdx * 31337 + sessionIdx * 1234567) >>> 0) % 100;

  // High attendance group (indices 6–99): ~88% present, ~7% late, ~5% absent
  if (studentIdx < 100) {
    if (dice < 5)  return AttendanceStatus.ABSENT;
    if (dice < 12) return AttendanceStatus.LATE;
    return AttendanceStatus.PRESENT;
  }

  // Medium attendance group (indices 100–149): ~78% present, ~8% late, ~14% absent
  if (studentIdx < 150) {
    if (dice < 14) return AttendanceStatus.ABSENT;
    if (dice < 22) return AttendanceStatus.LATE;
    return AttendanceStatus.PRESENT;
  }

  // Low attendance group (indices 150–199): ~52% present, ~10% late, ~38% absent (all FLAGGED)
  if (dice < 38) return AttendanceStatus.ABSENT;
  if (dice < 48) return AttendanceStatus.LATE;
  return AttendanceStatus.PRESENT;
}

// Creates a UTC Date from a date string and hour/minute in IST (UTC+5:30).
function ist(dateStr: string, hIST: number, mIST: number): Date {
  const totalMin = hIST * 60 + mIST - 330; // subtract 5h30m to convert IST→UTC
  const safeMin = ((totalMin % 1440) + 1440) % 1440;
  const h = Math.floor(safeMin / 60);
  const m = safeMin % 60;
  return new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`);
}

export async function seedDemoDatabase(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Starting database seed (200 students)...');

  // --- CLEANUP (reverse FK dependency order) ---
  await prisma.incident.deleteMany();
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

  const studentPw = await bcrypt.hash('pass123', 10);
  const staffPw   = await bcrypt.hash('secure123', 10);

  // ── STAFF ──────────────────────────────────────────────────────────────────
  console.log('Creating staff accounts...');

  await prisma.account.create({
    data: {
      rollNumber: 'SEC1001', email: 'security1@campus.edu', password: staffPw,
      status: AccountStatus.ACTIVE, role: UserRole.SECURITY,
      profile: { create: { firstName: 'Vikram', lastName: 'Singh', rfidTag: 'RFID_SEC_001' } },
    },
  });

  await prisma.account.create({
    data: {
      rollNumber: 'ADM1001', email: 'admin1@campus.edu', password: staffPw,
      status: AccountStatus.ACTIVE, role: UserRole.ADMIN,
      profile: { create: { firstName: 'Admin', lastName: 'User', rfidTag: 'RFID_ADMIN_001' } },
    },
  });

  const facultyAccount = await prisma.account.create({
    data: {
      rollNumber: 'FAC1001', email: 'faculty1@campus.edu', password: staffPw,
      status: AccountStatus.ACTIVE, role: UserRole.FACULTY,
      facultyProfile: {
        create: { firstName: 'Dr. Neha', lastName: 'Kapoor', department: 'Computer Science', title: 'Associate Professor' },
      },
    },
  });

  // ── NAMED DEMO STUDENTS (CS21001–CS21006) ──────────────────────────────────
  console.log('Creating named demo students...');

  const namedDefs = [
    { roll: 'CS21001', first: 'Rahul',  last: 'Sharma',   rfid: 'RFID_A_001', status: AccountStatus.PENDING, token: 'activation_token_001' },
    { roll: 'CS21002', first: 'Anjali', last: 'Verma',    rfid: 'RFID_B_002', status: AccountStatus.ACTIVE },
    { roll: 'CS21003', first: 'Rohan',  last: 'Mehta',    rfid: 'RFID_C_003', status: AccountStatus.ACTIVE },
    { roll: 'CS21004', first: 'Priya',  last: 'Nair',     rfid: 'RFID_D_004', status: AccountStatus.ACTIVE },
    { roll: 'CS21005', first: 'Meera',  last: 'Joshi',    rfid: 'RFID_E_005', status: AccountStatus.ACTIVE },
    { roll: 'CS21006', first: 'Kabir',  last: 'Malhotra', rfid: 'RFID_F_006', status: AccountStatus.ACTIVE },
  ];

  const namedAccounts: Array<{ id: string }> = [];
  for (const s of namedDefs) {
    const acc = await prisma.account.create({
      data: {
        rollNumber: s.roll,
        email: `${s.roll.toLowerCase()}@campus.edu`,
        password: studentPw,
        status: s.status,
        role: UserRole.STUDENT,
        activationToken: (s as { token?: string }).token,
        profile: { create: { firstName: s.first, lastName: s.last, rfidTag: s.rfid } },
      },
    });
    namedAccounts.push(acc);
  }

  // ── BULK STUDENTS (CS21007–CS21200) ────────────────────────────────────────
  console.log('Creating 194 bulk students...');

  const bulkAccountData: Array<{
    rollNumber: string; email: string; password: string;
    status: AccountStatus; role: UserRole;
  }> = [];
  const bulkProfileMeta: Array<{ rollNumber: string; firstName: string; lastName: string; rfidTag: string }> = [];

  for (let i = 7; i <= 200; i++) {
    const roll = `CS21${String(i).padStart(3, '0')}`;
    bulkAccountData.push({
      rollNumber: roll,
      email: `${roll.toLowerCase()}@campus.edu`,
      password: studentPw,
      status: AccountStatus.ACTIVE,
      role: UserRole.STUDENT,
    });
    bulkProfileMeta.push({
      rollNumber: roll,
      firstName: pick(FIRST, i * 3 + 17),
      lastName: pick(LAST, i * 7 + 11),
      rfidTag: `RFID_BLK_${String(i).padStart(3, '0')}`,
    });
  }

  await prisma.account.createMany({ data: bulkAccountData });

  const bulkAccounts = await prisma.account.findMany({
    where: { rollNumber: { in: bulkProfileMeta.map(m => m.rollNumber) } },
    select: { id: true, rollNumber: true },
  });
  const rollToId = new Map(bulkAccounts.map(a => [a.rollNumber, a.id]));

  await prisma.studentProfile.createMany({
    data: bulkProfileMeta.map(m => ({
      accountId: rollToId.get(m.rollNumber)!,
      firstName: m.firstName,
      lastName: m.lastName,
      rfidTag: m.rfidTag,
    })),
  });

  // Fetch ALL 200 students ordered by rollNumber for deterministic indexing
  const allStudents = await prisma.account.findMany({
    where: { role: UserRole.STUDENT },
    orderBy: { rollNumber: 'asc' },
    select: { id: true, rollNumber: true },
  });
  console.log(`Total students created: ${allStudents.length}`);

  // ── GEOFENCES ──────────────────────────────────────────────────────────────
  console.log('Creating campus geofences...');

  // Geofences are spread in different cardinal directions from campus centre (28.4090, 77.3180)
  // so the map shows a 2-D campus layout instead of a diagonal line.
  // Main/Back Gates on the N-S axis; CS block to the east; Library north-east;
  // Canteen at centre; Parking + Sports to the south-west.
  // TODO: replace with validated campus coordinates once the team confirms the real campus map points.
  const mainGate = await prisma.geofence.create({ data: { name: 'Main Campus Gate',    type: 'GATE',      coordinates: { lat: 28.4072, lng: 77.3180 }, radius: 50.0 } });
  const backGate = await prisma.geofence.create({ data: { name: 'Back Campus Gate',    type: 'GATE',      coordinates: { lat: 28.4110, lng: 77.3165 }, radius: 45.0 } });
                   await prisma.geofence.create({ data: { name: 'CS Building',         type: 'BUILDING',  coordinates: { lat: 28.4091, lng: 77.3200 }, radius: 80.0 } });
  const cs101    = await prisma.geofence.create({ data: { name: 'CS-101 Lecture Hall', type: 'CLASSROOM', coordinates: { lat: 28.4089, lng: 77.3198 }, radius: 15.0 } });
  const cs102    = await prisma.geofence.create({ data: { name: 'CS-102 Lecture Hall', type: 'CLASSROOM', coordinates: { lat: 28.4092, lng: 77.3202 }, radius: 15.0 } });
  const cs103    = await prisma.geofence.create({ data: { name: 'CS-103 Lab',          type: 'CLASSROOM', coordinates: { lat: 28.4094, lng: 77.3205 }, radius: 18.0 } });
  const parkingA = await prisma.geofence.create({ data: { name: 'Parking Zone A',      type: 'PARKING',   coordinates: { lat: 28.4082, lng: 77.3158 }, radius: 35.0 } });
  const library  = await prisma.geofence.create({ data: { name: 'Central Library',     type: 'BUILDING',  coordinates: { lat: 28.4105, lng: 77.3192 }, radius: 40.0 } });
  const canteen  = await prisma.geofence.create({ data: { name: 'Student Canteen',     type: 'CAFETERIA', coordinates: { lat: 28.4090, lng: 77.3180 }, radius: 25.0 } });
  const sports   = await prisma.geofence.create({ data: { name: 'Sports Complex',      type: 'SPORTS',    coordinates: { lat: 28.4068, lng: 77.3152 }, radius: 60.0 } });

  // ── COURSES, SECTIONS, GROUPS ──────────────────────────────────────────────
  console.log('Creating courses, sections, groups...');

  const ds   = await prisma.course.create({ data: { code: 'CS201', title: 'Data Structures', department: 'Computer Science', credits: 4 } });
  const algo = await prisma.course.create({ data: { code: 'CS202', title: 'Algorithms',       department: 'Computer Science', credits: 3 } });

  const cs201A = await prisma.section.create({ data: { courseId: ds.id,   code: 'A', term: 'Spring', year: 2026 } });
  const cs202A = await prisma.section.create({ data: { courseId: algo.id, code: 'A', term: 'Spring', year: 2026 } });

  const groupA1 = await prisma.studentGroup.create({ data: { sectionId: cs201A.id, code: 'A1', name: 'Group 1' } });
  const groupA2 = await prisma.studentGroup.create({ data: { sectionId: cs201A.id, code: 'A2', name: 'Group 2' } });

  // Enroll all 200 students: first 100 → Group A1, next 100 → Group A2
  const membershipData = allStudents.map((s, i) => ({
    groupId: i < 100 ? groupA1.id : groupA2.id,
    accountId: s.id,
  }));
  for (let i = 0; i < membershipData.length; i += 200) {
    await prisma.studentGroupMembership.createMany({ data: membershipData.slice(i, i + 200) });
  }

  await prisma.facultyAssignment.createMany({
    data: [
      { facultyAccountId: facultyAccount.id, sectionId: cs201A.id, groupId: null },
      { facultyAccountId: facultyAccount.id, sectionId: cs202A.id, groupId: null },
    ],
  });

  const templateDsMon  = await prisma.classSessionTemplate.create({
    data: { sectionId: cs201A.id, groupId: null, facultyAccountId: facultyAccount.id, dayOfWeek: 1, startTime: '09:00', endTime: '10:00', room: 'CS-101', geofenceId: cs101.id },
  });
  const templateDsWed  = await prisma.classSessionTemplate.create({
    data: { sectionId: cs201A.id, groupId: null, facultyAccountId: facultyAccount.id, dayOfWeek: 3, startTime: '09:00', endTime: '10:00', room: 'CS-101', geofenceId: cs101.id },
  });
  const templateAlgoTue = await prisma.classSessionTemplate.create({
    data: { sectionId: cs202A.id, groupId: null, facultyAccountId: facultyAccount.id, dayOfWeek: 2, startTime: '11:00', endTime: '12:00', room: 'CS-102', geofenceId: cs102.id },
  });

  // ── ATTENDANCE RECORDS — 4 WEEKS ──────────────────────────────────────────
  console.log('Creating 4 weeks of attendance records for 200 students...');

  // 8 CS201 sessions: Mon + Wed for 4 consecutive weeks
  const cs201Sessions = [
    { templateId: templateDsMon.id,  date: new Date('2026-04-06T03:30:00.000Z') }, // Mon Apr 6  9AM IST
    { templateId: templateDsWed.id,  date: new Date('2026-04-08T03:30:00.000Z') }, // Wed Apr 8
    { templateId: templateDsMon.id,  date: new Date('2026-04-13T03:30:00.000Z') }, // Mon Apr 13
    { templateId: templateDsWed.id,  date: new Date('2026-04-15T03:30:00.000Z') }, // Wed Apr 15
    { templateId: templateDsMon.id,  date: new Date('2026-04-20T03:30:00.000Z') }, // Mon Apr 20
    { templateId: templateDsWed.id,  date: new Date('2026-04-22T03:30:00.000Z') }, // Wed Apr 22
    { templateId: templateDsMon.id,  date: new Date('2026-04-27T03:30:00.000Z') }, // Mon Apr 27
    { templateId: templateDsWed.id,  date: new Date('2026-04-29T03:30:00.000Z') }, // Wed Apr 29
  ];

  type AttRecord = {
    accountId: string; classSessionTemplateId: string; scheduledDate: Date;
    timestamp: Date; status: AttendanceStatus; method: AttendanceMethod;
    qrToken: string | null; geofenceValidated: boolean; markedByFacultyId: string | null;
  };

  const attendanceBatch: AttRecord[] = [];

  for (let si = 0; si < cs201Sessions.length; si++) {
    const sess = cs201Sessions[si];
    for (let stIdx = 0; stIdx < allStudents.length; stIdx++) {
      const status = getAttendanceStatus(stIdx, si);
      if (status === null) continue;

      const isAbsent = status === AttendanceStatus.ABSENT;
      const isLate   = status === AttendanceStatus.LATE;
      const offsetMs = isLate
        ? (15 + (stIdx % 14)) * 60 * 1000   // 15–28 min late
        : (1  + (stIdx % 8))  * 60 * 1000;  // 1–8 min early/on-time

      attendanceBatch.push({
        accountId:              allStudents[stIdx].id,
        classSessionTemplateId: sess.templateId,
        scheduledDate:          sess.date,
        timestamp:              new Date(sess.date.getTime() + offsetMs),
        status,
        method:                 isAbsent ? AttendanceMethod.MANUAL : AttendanceMethod.QR,
        qrToken:                isAbsent ? null : `qr_${sess.date.toISOString().slice(0, 10)}_${si}`,
        geofenceValidated:      !isAbsent,
        markedByFacultyId:      isAbsent ? facultyAccount.id : null,
      });
    }
  }

  for (let i = 0; i < attendanceBatch.length; i += 400) {
    await prisma.attendanceRecord.createMany({ data: attendanceBatch.slice(i, i + 400) });
  }
  console.log(`  → ${attendanceBatch.length} attendance records`);

  // ── ACCESS EVENTS — 5 DAYS ─────────────────────────────────────────────────
  console.log('Creating access events for May 4–8...');

  type AccessRec = {
    accountId: string; geofenceId: string; action: AccessAction;
    reason: AccessReason | null; timestamp: Date;
  };
  const accessEvents: AccessRec[] = [];

  const weekDays = ['2026-05-04', '2026-05-05', '2026-05-06', '2026-05-07', '2026-05-08'];

  for (let dayIdx = 0; dayIdx < weekDays.length; dayIdx++) {
    const day = weekDays[dayIdx];
    // 48 active students per day, staggered across the week
    const activeStart = (dayIdx * 37) % 190;
    const dayStudents = Array.from({ length: 48 }, (_, k) => allStudents[(activeStart + k) % 200]);

    for (let i = 0; i < dayStudents.length; i++) {
      const s = dayStudents[i];
      const gate = i % 6 === 0 ? backGate : mainGate;

      // Morning entry (8:00–10:00 IST)
      accessEvents.push({ accountId: s.id, geofenceId: gate.id, action: AccessAction.ENTRY, reason: null,
        timestamp: ist(day, 8 + (i % 2), 5 + (i * 13) % 50) });

      // Classroom entry (9:00–10:30 IST)
      const classroom = i % 3 === 0 ? cs102.id : cs101.id;
      accessEvents.push({ accountId: s.id, geofenceId: classroom, action: AccessAction.ENTRY, reason: null,
        timestamp: ist(day, 9, (i * 7) % 58) });

      // Library visit for 1 in 4 students (10:30–12:00 IST)
      if (i % 4 === 1) {
        accessEvents.push({ accountId: s.id, geofenceId: library.id, action: AccessAction.ENTRY, reason: null,
          timestamp: ist(day, 10 + (i % 2), 30 + (i * 7) % 25) });
      }

      // Canteen visit for 1 in 5 students (12:30–13:30 IST)
      if (i % 5 === 2) {
        accessEvents.push({ accountId: s.id, geofenceId: canteen.id, action: AccessAction.ENTRY, reason: null,
          timestamp: ist(day, 12, 30 + (i * 11) % 55) });
      }

      // Evening exit (17:00–19:00 IST)
      accessEvents.push({ accountId: s.id, geofenceId: gate.id, action: AccessAction.EXIT, reason: null,
        timestamp: ist(day, 17 + (i % 2), (i * 11) % 55) });
    }

    // 5–6 denials per day
    const denialBase = (dayIdx * 11) % 190;
    const denialReasons: AccessReason[] = [
      AccessReason.UNAUTHORIZED_AREA, AccessReason.OUT_OF_HOURS, AccessReason.INVALID_RFID,
      AccessReason.UNAUTHORIZED_AREA, AccessReason.OUT_OF_HOURS,
    ];
    const denialGates = [parkingA.id, sports.id, backGate.id, parkingA.id, sports.id];
    for (let j = 0; j < 5; j++) {
      accessEvents.push({
        accountId: allStudents[(denialBase + j) % 200].id,
        geofenceId: denialGates[j],
        action: AccessAction.DENIED,
        reason: denialReasons[j],
        timestamp: ist(day, 7 + (j % 3), (j * 13) % 55),
      });
    }
  }

  // Rahul (CS21001, PENDING) denied at Main Gate today
  accessEvents.push({
    accountId: allStudents[0].id, geofenceId: mainGate.id,
    action: AccessAction.DENIED, reason: AccessReason.INACTIVE_ACCOUNT,
    timestamp: ist('2026-05-08', 8, 22),
  });

  for (let i = 0; i < accessEvents.length; i += 400) {
    await prisma.accessEvent.createMany({ data: accessEvents.slice(i, i + 400) });
  }
  console.log(`  → ${accessEvents.length} access events`);

  // ── PRESENCE LOCATIONS ─────────────────────────────────────────────────────
  console.log('Creating presence location data...');

  const now = Date.now();
  type PresRec = { accountId: string; latitude: number; longitude: number; recordedAt: Date };
  const presenceData: PresRec[] = [];

  const minsAgo = (m: number) => new Date(now - m * 60 * 1000);

  // Feature E: Full-day trails for 3 named students (Anjali, Rohan, Priya)
  const fullTrails: Array<{ accountId: string; points: Array<{ lat: number; lng: number; m: number }> }> = [
    {
      accountId: allStudents[1].id, // Anjali CS21002
      points: [
        { lat: 28.40722, lng: 77.31803, m: 545 }, // 08:35 IST — Main Gate (south)
        { lat: 28.40912, lng: 77.32003, m: 518 }, // 09:02 IST — CS Building (east)
        { lat: 28.40891, lng: 77.31982, m: 505 }, // 09:15 IST — CS-101
        { lat: 28.40908, lng: 77.31998, m: 445 }, // 10:15 IST — CS Building
        { lat: 28.41051, lng: 77.31921, m: 415 }, // 10:45 IST — Central Library (north-east)
        { lat: 28.40901, lng: 77.31801, m: 355 }, // 11:45 IST — Student Canteen (centre)
        { lat: 28.40910, lng: 77.32001, m: 290 }, // 12:50 IST — CS Building
        { lat: 28.40921, lng: 77.32022, m: 250 }, // 13:30 IST — CS-102
        { lat: 28.41052, lng: 77.31922, m: 145 }, // 15:35 IST — Library
        { lat: 28.40718, lng: 77.31798, m: 42  }, // 17:28 IST — Main Gate (heading out)
        { lat: 28.40716, lng: 77.31796, m: 6   }, // now-6min   — near Main Gate
      ],
    },
    {
      accountId: allStudents[2].id, // Rohan CS21003
      points: [
        { lat: 28.41099, lng: 77.31651, m: 525 }, // 08:30 IST — Back Gate (north)
        { lat: 28.40912, lng: 77.32002, m: 498 }, // 08:57 IST — CS Building (east)
        { lat: 28.40890, lng: 77.31981, m: 483 }, // 09:12 IST — CS-101
        { lat: 28.40902, lng: 77.31802, m: 378 }, // 10:57 IST — Student Canteen (centre)
        { lat: 28.40911, lng: 77.32001, m: 308 }, // 12:07 IST — CS Building
        { lat: 28.40921, lng: 77.32022, m: 270 }, // 12:45 IST — CS-102
        { lat: 28.40681, lng: 77.31522, m: 125 }, // 15:45 IST — Sports Complex (south-west)
        { lat: 28.41098, lng: 77.31648, m: 18  }, // 17:57 IST — Back Gate (exiting)
      ],
    },
    {
      accountId: allStudents[3].id, // Priya CS21004
      points: [
        { lat: 28.40719, lng: 77.31800, m: 490 }, // 08:50 IST — Main Gate (south)
        { lat: 28.40909, lng: 77.32001, m: 460 }, // 09:20 IST — CS Building (east)
        { lat: 28.41052, lng: 77.31921, m: 415 }, // 10:05 IST — Library (north-east)
        { lat: 28.40901, lng: 77.31801, m: 340 }, // 11:20 IST — Canteen (centre)
        { lat: 28.40910, lng: 77.32002, m: 260 }, // 12:40 IST — CS Building
        { lat: 28.41050, lng: 77.31919, m: 170 }, // 14:10 IST — Library
        { lat: 28.40720, lng: 77.31800, m: 38  }, // 17:37 IST — Main Gate (exit)
      ],
    },
  ];

  for (const { accountId, points } of fullTrails) {
    for (const p of points) {
      presenceData.push({ accountId, latitude: p.lat, longitude: p.lng, recordedAt: minsAgo(p.m) });
    }
  }

  // Feature B: Current positions for ~25 more students spread across geofences
  // Meera (index 4) and Kabir (index 5) are near CS-103 and CS-101 right now
  presenceData.push({ accountId: allStudents[4].id, latitude: 28.40941, longitude: 77.32052, recordedAt: minsAgo(9) });  // Meera → CS-103 (east)
  presenceData.push({ accountId: allStudents[5].id, latitude: 28.40890, longitude: 77.31980, recordedAt: minsAgo(12) }); // Kabir → CS-101 (east)

  const currentPositionClusters: Array<{ lat: number; lng: number; delta: number; count: number; startIdx: number }> = [
    { lat: 28.40890, lng: 77.31982, delta: 0.00007, count: 7,  startIdx: 6   }, // CS-101 cluster (east)
    { lat: 28.40921, lng: 77.32021, delta: 0.00007, count: 6,  startIdx: 13  }, // CS-102 cluster (east)
    { lat: 28.40941, lng: 77.32051, delta: 0.00007, count: 5,  startIdx: 19  }, // CS-103 cluster (east)
    { lat: 28.41051, lng: 77.31921, delta: 0.00015, count: 5,  startIdx: 24  }, // Library cluster (north-east)
    { lat: 28.40901, lng: 77.31800, delta: 0.00010, count: 5,  startIdx: 29  }, // Canteen cluster (centre)
    { lat: 28.40821, lng: 77.31581, delta: 0.00012, count: 4,  startIdx: 34  }, // Parking cluster (west)
    { lat: 28.40721, lng: 77.31801, delta: 0.00015, count: 5,  startIdx: 38  }, // Main Gate cluster (south)
  ];

  for (const cluster of currentPositionClusters) {
    for (let k = 0; k < cluster.count; k++) {
      const si = cluster.startIdx + k;
      const mAgo = 3 + k * 5;
      presenceData.push({
        accountId:  allStudents[si].id,
        latitude:   jitter(cluster.lat, cluster.delta, si * 7 + k * 3),
        longitude:  jitter(cluster.lng, cluster.delta, si * 11 + k * 5),
        recordedAt: minsAgo(mAgo),
      });
    }
  }

  // Stale signals for 8 students (~3–6 hours ago → shows as "No Signal / Missing" on map)
  for (let i = 0; i < 8; i++) {
    const si = 45 + i;
    presenceData.push({
      accountId:  allStudents[si].id,
      latitude:   jitter(28.40900, 0.0003, si * 13),
      longitude:  jitter(77.31800, 0.0003, si * 17),
      recordedAt: minsAgo(240 + i * 30),
    });
  }

  for (let i = 0; i < presenceData.length; i += 400) {
    await prisma.presenceLocation.createMany({ data: presenceData.slice(i, i + 400) });
  }
  console.log(`  → ${presenceData.length} presence records`);

  console.log(`\n✅ Seed complete!
  • 200 students (CS21001–CS21200) + 3 staff
  • 10 geofences across campus
  • ${attendanceBatch.length} attendance records across 8 sessions (4 weeks)
    – Anjali 87.5% | Meera 100% | Rohan 62.5%↓ | Priya 50%↓ | Kabir 62.5%↓
    – ~50 students (indices 150–199) below 75% threshold
  • ${accessEvents.length} access events across Mon–Fri May 4–8
  • ${presenceData.length} presence records
    – Full-day trails for Anjali, Rohan, Priya
    – 37 students with current campus positions`);
}
