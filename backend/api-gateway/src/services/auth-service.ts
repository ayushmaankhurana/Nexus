// import { StudentAccount, AppError } from '@nexus/core';
// import { MockAuthStore } from '../stores/mock-auth-store';
// import { AuthResponse } from '../schemas/auth';

// export class AuthService {
//   constructor(private store: MockAuthStore, private signJwt: (payload: any, expiresIn: string) => string) {}

//   activate(activationToken: string, password: string): StudentAccount {
//     return this.store.activateAccountByToken(activationToken, password);
//   }

//   login(
//     identifier: string,
//     password: string,
//     deviceId: string
//   ): AuthResponse {
//     const account = this.store.getAccountByEmailOrRollNumber(identifier);

//     if (!account) {
//       throw new AppError(
//         'INVALID_CREDENTIALS',
//         401,
//         'Invalid roll number/email or password'
//       );
//     }

//     if (!this.store.validatePassword(account, password)) {
//       throw new AppError(
//         'INVALID_CREDENTIALS',
//         401,
//         'Invalid roll number/email or password'
//       );
//     }

//     if (account.status === 'pending') {
//       throw new AppError(
//         'ACCOUNT_NOT_ACTIVATED',
//         403,
//         'Account must be activated before login'
//       );
//     }

//     const hasActiveDevice = this.store.hasActiveDeviceSession(account.studentId);
//     if (hasActiveDevice) {
//       throw new AppError(
//         'DEVICE_ALREADY_BOUND',
//         409,
//         'Another device is already bound to this account'
//       );
//     }

//     const payload = { sub: account.studentId, deviceId, role: 'student' };
//     const accessToken = this.signJwt(payload, '15m');
//     const refreshToken = this.signJwt({ ...payload, isRefresh: true }, '7d');

//     const session = this.store.createSession(account.studentId, deviceId, accessToken, refreshToken);
    
//     return {
//       accessToken: session.accessToken,
//       refreshToken: session.refreshToken,
//       expiresIn: 900,
//       tokenType: 'Bearer',
//       user: {
//         id: account.studentId,
//         rollNumber: account.rollNumber,
//         email: account.email,
//         role: 'student',
//       },
//     };
//   }

//   logout(studentId: string, deviceId: string): void {
//     const account = this.store.getAccountById(studentId);

//     if (!account) {
//       throw new AppError(
//         'ACCOUNT_NOT_FOUND',
//         404,
//         'Account not found'
//       );
//     }

//     const session = this.store.getActiveDeviceSession(studentId);

//     if (!session || session.deviceId !== deviceId) {
//       throw new AppError(
//         'SESSION_NOT_FOUND',
//         404,
//         'No active session for this device'
//       );
//     }

//     this.store.invalidateSession(session.accessToken);
//   }

//   deviceSwitch(
//     studentId: string,
//     oldDeviceId: string,
//     newDeviceId: string
//   ): AuthResponse {
//     const account = this.store.getAccountById(studentId);

//     if (!account) {
//       throw new AppError(
//         'ACCOUNT_NOT_FOUND',
//         404,
//         'Account not found'
//       );
//     }

//     const payload = { sub: studentId, deviceId: newDeviceId, role: 'student' };
//     const accessToken = this.signJwt(payload, '15m');
//     const refreshToken = this.signJwt({ ...payload, isRefresh: true }, '7d');

//     this.store.switchDevice(studentId, oldDeviceId, newDeviceId, accessToken, refreshToken);

//     return {
//       accessToken,
//       refreshToken,
//       expiresIn: 900,
//       tokenType: 'Bearer',
//       user: {
//         id: account.studentId,
//         rollNumber: account.rollNumber,
//         email: account.email,
//         role: 'student',
//       },
//     };
//   }
// }
import { StudentAccount, AppError } from '@nexus/core';
import { PrismaAuthStore } from '../stores/prisma-auth-store';
import { AuthResponse } from '../schemas/auth';

export class AuthService {
  // Constructor now accepts the Prisma store
  constructor(
    private store: PrismaAuthStore, 
    private signJwt: (payload: any, expiresIn: string) => string
  ) {}

  // All methods are now async
  async activate(activationToken: string, password: string): Promise<StudentAccount> {
    return await this.store.activateAccountByToken(activationToken, password);
  }

  async login(
    identifier: string,
    password: string,
    deviceId: string
  ): Promise<AuthResponse> {
    // AWAIT the database lookup
    const account = await this.store.getAccountByEmailOrRollNumber(identifier);

    if (!account) {
      throw new AppError(
        'INVALID_CREDENTIALS',
        401,
        'Invalid roll number/email or password'
      );
    }

    // AWAIT the password validation
    if (!await this.store.validatePassword(account, password)) {
      throw new AppError(
        'INVALID_CREDENTIALS',
        401,
        'Invalid roll number/email or password'
      );
    }
    
    console.log("DATABASE HANDED ME THIS ROLE:", account.role);

    if (account.status === 'pending') {
      throw new AppError(
        'ACCOUNT_NOT_ACTIVATED',
        403,
        'Account must be activated before login'
      );
    }

    const activeSession = await this.store.getActiveDeviceSession(account.studentId);
    
    if (activeSession) {
      // If it's the SAME device logging in again, just clear the old session
      if (activeSession.deviceId === deviceId) {
        await this.store.invalidateSession(activeSession.accessToken);
      } else {
        // If it's a DIFFERENT device, trigger the strict block
        throw new AppError(
          'DEVICE_ALREADY_BOUND',
          409,
          'Another device is already bound to this account. Please use the device switch flow.'
        );
      }
    }

    // JWT payload uses standard 'sub' for the account ID
    const payload = { sub: account.studentId, deviceId, role: account.role };
    const accessToken = this.signJwt(payload, '15m');
    const refreshToken = this.signJwt({ ...payload, isRefresh: true }, '7d');
    const displayName = (await this.store.getAccountDisplayName(account.studentId)) ?? account.rollNumber;

    // AWAIT the session creation in the DB
    const session = await this.store.createSession(account.studentId, deviceId, accessToken, refreshToken);
    
    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn: 900,
      tokenType: 'Bearer',
      user: {
        id: account.studentId,
        name: displayName,
        rollNumber: account.rollNumber,
        email: account.email,
        role: account.role,
      },
    };
  }

  async logout(studentId: string, deviceId: string): Promise<void> {
    const account = await this.store.getAccountById(studentId);

    if (!account) {
      throw new AppError(
        'ACCOUNT_NOT_FOUND',
        404,
        'Account not found'
      );
    }

    const session = await this.store.getActiveDeviceSession(studentId);

    if (!session || session.deviceId !== deviceId) {
      throw new AppError(
        'SESSION_NOT_FOUND',
        404,
        'No active session for this device'
      );
    }

    // AWAIT the session deletion
    await this.store.invalidateSession(session.accessToken);
  }

  async deviceSwitch(
    studentId: string,
    oldDeviceId: string,
    newDeviceId: string
  ): Promise<AuthResponse> {
    const account = await this.store.getAccountById(studentId);

    if (!account) {
      throw new AppError(
        'ACCOUNT_NOT_FOUND',
        404,
        'Account not found'
      );
    }

    const payload = { sub: studentId, deviceId: newDeviceId, role: account.role };
    const accessToken = this.signJwt(payload, '15m');
    const refreshToken = this.signJwt({ ...payload, isRefresh: true }, '7d');
    const displayName = (await this.store.getAccountDisplayName(account.studentId)) ?? account.rollNumber;

    // AWAIT the atomic switch operation
    await this.store.switchDevice(studentId, oldDeviceId, newDeviceId, accessToken, refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      tokenType: 'Bearer',
      user: {
        id: account.studentId,
        name: displayName,
        rollNumber: account.rollNumber,
        email: account.email,
        role: account.role,
      },
    };
  }

  // --- NEW REFRESH METHOD ---
  async refresh(refreshToken: string, deviceId: string): Promise<AuthResponse> {
    // 1. Verify the session actually exists in Postgres
    const session = await this.store.getActiveDeviceSessionByToken(refreshToken, deviceId);

    if (!session) {
      throw new AppError('INVALID_GRANT', 401, 'Invalid or expired refresh token');
    }

    if (session.expiresAt < new Date()) {
      // Clean up the expired session
      await this.store.invalidateSession(session.accessToken);
      throw new AppError('TOKEN_EXPIRED', 401, 'Refresh token has expired. Please log in again.');
    }

    // 2. Fetch the account to get the role for the new JWT
    const account = await this.store.getAccountById(session.studentId);
    if (!account) {
      throw new AppError('ACCOUNT_NOT_FOUND', 404, 'Account no longer exists');
    }

    // 3. Generate new tokens
    const payload = { sub: account.studentId, deviceId, role: account.role };
    const newAccessToken = this.signJwt(payload, '15m');
    const newRefreshToken = this.signJwt({ ...payload, isRefresh: true }, '7d');
    const displayName = (await this.store.getAccountDisplayName(account.studentId)) ?? account.rollNumber;

    // 4. Atomically replace the old session with the new one
    // We use switchDevice here because it perfectly handles deleting the old tokens and inserting new ones for the same device
    await this.store.switchDevice(
      account.studentId, 
      deviceId, // old device ID 
      deviceId, // new device ID is the exact same
      newAccessToken, 
      newRefreshToken
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
      tokenType: 'Bearer',
      user: {
        id: account.studentId,
        name: displayName,
        rollNumber: account.rollNumber,
        email: account.email,
        role: account.role,
      },
    };
  }
}