import { PrismaClient, UserRole, AccountStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { StudentAccount, Session, AppError } from '@nexus/core';

export class PrismaAuthStore {
  private prisma: PrismaClient;

  constructor() {
    const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }

  const pool = new pg.Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  this.prisma = new PrismaClient({ adapter });
}
  private mapSession(dbSession: any): Session {
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
  // Helper to map DB account to our Core StudentAccount type
  private mapAccount(dbAccount: any): StudentAccount {
    return {
      studentId: dbAccount.id,
      rollNumber: dbAccount.rollNumber,
      email: dbAccount.email,
      password: dbAccount.password,
      status: dbAccount.status.toLowerCase() as any,
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

  async createSession(
    studentId: string,
    deviceId: string,
    accessToken: string,
    refreshToken: string
    ): Promise<Session> {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const session = await this.prisma.session.create({
        data: {
        accountId: studentId,
        deviceId,
        accessToken,
        refreshToken,
        expiresAt,
        },
    });

    return this.mapSession(session); // Use the mapper here
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
  
  return session ? this.mapSession(session) : null; // Use the mapper here
}

  async invalidateSession(accessToken: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { accessToken },
    });
  }

  // Add the remaining methods (activateAccountByToken, validatePassword, etc.) 
  // following the same async pattern...

//   async activateAccountByToken(token: string): Promise<void> {
//     const account = await this.prisma.account.findFirst({
//       where: { activationToken: token },
//     });
//   }

//   async validatePassword(studentId: string, password: string): Promise<boolean> {
//     const account = await this.prisma.account.findUnique({
//       where: { id: studentId },
//     });
//     if (!account) return false;
//     // In a real implementation, you would compare the password here
//     return true;
//   }

  // 1. Find account by token (needed for the first step of activation)
  async getAccountByActivationToken(token: string): Promise<StudentAccount | null> {
    const account = await this.prisma.account.findFirst({
      where: { activationToken: token },
    });
    return account ? this.mapAccount(account) : null;
  }

  // 2. The full activation logic: status change + password set + token clear
  async activateAccountByToken(token: string, newPassword: string): Promise<StudentAccount> {
    const updatedAccount = await this.prisma.account.update({
      where: { activationToken: token },
      data: {
        status: 'ACTIVE',
        password: newPassword, // Note: We should add bcrypt hashing here in the next sprint
        activationToken: null, // Clear the token so it can't be used again
      },
    });

    return this.mapAccount(updatedAccount);
  }

  // 3. Password validation
  // We take the whole account object to match your AuthService's current logic
  async validatePassword(account: StudentAccount, password: string): Promise<boolean> {
    // Currently comparing plaintext as per the dev state
    // Once we add hashing, this will become: return await bcrypt.compare(password, account.password);
    return account.password === password;
  }

  // 4. Atomic Device Switching
  async switchDevice(
    studentId: string, 
    oldDeviceId: string, 
    newDeviceId: string, 
    accessToken: string, 
    refreshToken: string
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // We use a transaction to ensure we don't end up with orphaned sessions
    await this.prisma.$transaction([
      // Remove the old binding
      this.prisma.session.deleteMany({
        where: {
          accountId: studentId,
          deviceId: oldDeviceId,
        },
      }),
      // Create the new binding
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
}