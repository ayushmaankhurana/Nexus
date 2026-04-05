import { PrismaClient, Account, Session as PrismaSession } from '@prisma/client';
import bcrypt from 'bcrypt';
import { StudentAccount, Session } from '@nexus/core';
import { getPrismaClient } from '../lib/prisma'; // <-- Import the singleton

type CreateStudentAccountInput = {
  rollNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  rfidTag?: string;
  activationToken: string;
};

export class PrismaAuthStore {
  private prisma: PrismaClient;

  constructor() {
    // 1. THE FIX: We just ask for the shared client. 
    // No more pg.Pool or PrismaPg in this file!
    this.prisma = getPrismaClient();
  }

  // 2. THE FIX: Replaced 'any' with 'PrismaSession'
  private mapSession(dbSession: PrismaSession): Session {
    return {
      id: dbSession.id,
      studentId: dbSession.accountId, // <--- The "Bridge": Map accountId to studentId
      deviceId: dbSession.deviceId,
      accessToken: dbSession.accessToken,
      refreshToken: dbSession.refreshToken,
      createdAt: dbSession.createdAt,
      expiresAt: dbSession.expiresAt,
    };
  }

  // 3. THE FIX: Replaced 'any' with 'Account'
  private mapAccount(dbAccount: Account): StudentAccount {
    return {
      studentId: dbAccount.id,
      rollNumber: dbAccount.rollNumber,
      email: dbAccount.email,
      password: dbAccount.password,
      status: dbAccount.status.toLowerCase() as any,
      role: dbAccount.role as any, // Mapped from DB role enum
      activationToken: dbAccount.activationToken || undefined,
    };
  }

  async getAccountByEmailOrRollNumber(identifier: string): Promise<StudentAccount | null> {
    const account = await this.prisma.account.findFirst({
      where: {
        OR: [{ email: identifier }, { rollNumber: identifier }],
      },
    });
    return account ? this.mapAccount(account) : null;
  }

  async getAccountById(studentId: string): Promise<StudentAccount | null> {
    const account = await this.prisma.account.findUnique({ where: { id: studentId } });
    return account ? this.mapAccount(account) : null;
  }

    async getAccountByRollNumber(rollNumber: string): Promise<StudentAccount | null> {
    const account = await this.prisma.account.findUnique({
      where: { rollNumber },
    });

    return account ? this.mapAccount(account) : null;
  }

  async getAccountByEmail(email: string): Promise<StudentAccount | null> {
    const account = await this.prisma.account.findUnique({
      where: { email },
    });

    return account ? this.mapAccount(account) : null;
  }

    async createStudentAccount(input: CreateStudentAccountInput): Promise<any> {
    const createdAccount = await this.prisma.account.create({
      data: {
        rollNumber: input.rollNumber,
        email: input.email,
        password: '',
        status: 'PENDING',
        role: 'STUDENT',
        activationToken: input.activationToken,
        profile: {
          create: {
            firstName: input.firstName,
            lastName: input.lastName,
            rfidTag: input.rfidTag,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    return {
      studentId: createdAccount.id,
      rollNumber: createdAccount.rollNumber,
      email: createdAccount.email,
      role: createdAccount.role.toLowerCase(),
      status: createdAccount.status.toLowerCase(),
      activationToken: createdAccount.activationToken ?? undefined,
      profile: {
        firstName: createdAccount.profile?.firstName ?? '',
        lastName: createdAccount.profile?.lastName ?? '',
        rfidTag: createdAccount.profile?.rfidTag ?? undefined,
      },
    };
  }

  async createSession(
    studentId: string,
    deviceId: string,
    accessToken: string,
    refreshToken: string
  ): Promise<Session> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days, 

    const session = await this.prisma.session.create({
      data: {
        accountId: studentId,
        deviceId,
        accessToken,
        refreshToken,
        expiresAt,
      },
    });

    return this.mapSession(session);
  }

  async hasActiveDeviceSession(studentId: string): Promise<boolean> {
    const session = await this.prisma.session.findFirst({
      where: { accountId: studentId },
    });
    return !!session;
  }

  async getActiveDeviceSession(studentId: string): Promise<Session | null> {
    const session = await this.prisma.session.findFirst({
      where: { accountId: studentId },
    });
    
    return session ? this.mapSession(session) : null;
  }

  async getActiveDeviceSessionByToken(refreshToken: string, deviceId: string): Promise<Session | null> {
    const session = await this.prisma.session.findFirst({
      where: { 
        refreshToken: refreshToken,
        deviceId: deviceId,
        expiresAt: { gt: new Date() },
      },
    });
    
    return session ? this.mapSession(session) : null;
  }

  async invalidateSession(accessToken: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { accessToken },
    });
  }

  async getAccountByActivationToken(token: string): Promise<StudentAccount | null> {
    const account = await this.prisma.account.findFirst({
      where: { activationToken: token },
    });
    return account ? this.mapAccount(account) : null;
  }

  async activateAccountByToken(token: string, newPassword: string): Promise<StudentAccount> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const updatedAccount = await this.prisma.account.update({
      where: { activationToken: token },
      data: {
        status: 'ACTIVE',
        password: hashedPassword,
        activationToken: null,
      },
    });

    return this.mapAccount(updatedAccount);
  }

  async validatePassword(account: StudentAccount, password: string): Promise<boolean> {
    return await bcrypt.compare(password, account.password);
  }

  async switchDevice(
    studentId: string, 
    oldDeviceId: string, 
    newDeviceId: string, 
    accessToken: string, 
    refreshToken: string
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.session.deleteMany({
        where: {
          accountId: studentId,
          deviceId: oldDeviceId,
        },
      }),
      this.prisma.session.create({
        data: {
          accountId: studentId,
          deviceId: newDeviceId,
          accessToken,
          refreshToken,
          expiresAt,
        },
      }),
    ]);
  }

  async getProfileById(studentId: string): Promise<{
  id: string;
  rollNumber: string;
  email: string;
  role: string;
  status: string;
  firstName: string;
  lastName: string;
  rfidTag: string | null;
} | null> {
  const account = await this.prisma.account.findUnique({
    where: { id: studentId },
    include: { profile: true },
  });

  if (!account || !account.profile) return null;

  return {
    id: account.id,
    rollNumber: account.rollNumber,
    email: account.email,
    role: account.role.toLowerCase(),
    status: account.status.toLowerCase(),
    firstName: account.profile.firstName,
    lastName: account.profile.lastName,
    rfidTag: account.profile.rfidTag ?? null,
  };
}
}