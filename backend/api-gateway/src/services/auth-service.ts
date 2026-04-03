import { StudentAccount, AppError } from '@nexus/core';
import { MockAuthStore } from '../stores/mock-auth-store';
import { AuthResponse } from '../schemas/auth';

export class AuthService {
  constructor(private store: MockAuthStore, private signJwt: (payload: any, expiresIn: string) => string) {}

  activate(activationToken: string, password: string): StudentAccount {
    return this.store.activateAccountByToken(activationToken, password);
  }

  login(
    identifier: string,
    password: string,
    deviceId: string
  ): AuthResponse {
    const account = this.store.getAccountByEmailOrRollNumber(identifier);

    if (!account) {
      throw new AppError(
        'INVALID_CREDENTIALS',
        401,
        'Invalid roll number/email or password'
      );
    }

    if (!this.store.validatePassword(account, password)) {
      throw new AppError(
        'INVALID_CREDENTIALS',
        401,
        'Invalid roll number/email or password'
      );
    }

    if (account.status === 'pending') {
      throw new AppError(
        'ACCOUNT_NOT_ACTIVATED',
        403,
        'Account must be activated before login'
      );
    }

    const hasActiveDevice = this.store.hasActiveDeviceSession(account.studentId);
    if (hasActiveDevice) {
      throw new AppError(
        'DEVICE_ALREADY_BOUND',
        409,
        'Another device is already bound to this account'
      );
    }

    const payload = { sub: account.studentId, deviceId, role: 'student' };
    const accessToken = this.signJwt(payload, '15m');
    const refreshToken = this.signJwt({ ...payload, isRefresh: true }, '7d');

    const session = this.store.createSession(account.studentId, deviceId, accessToken, refreshToken);
    
    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn: 900,
      tokenType: 'Bearer',
      user: {
        id: account.studentId,
        rollNumber: account.rollNumber,
        email: account.email,
        role: 'student',
      },
    };
  }

  logout(studentId: string, deviceId: string): void {
    const account = this.store.getAccountById(studentId);

    if (!account) {
      throw new AppError(
        'ACCOUNT_NOT_FOUND',
        404,
        'Account not found'
      );
    }

    const session = this.store.getActiveDeviceSession(studentId);

    if (!session || session.deviceId !== deviceId) {
      throw new AppError(
        'SESSION_NOT_FOUND',
        404,
        'No active session for this device'
      );
    }

    this.store.invalidateSession(session.accessToken);
  }

  deviceSwitch(
    studentId: string,
    oldDeviceId: string,
    newDeviceId: string
  ): AuthResponse {
    const account = this.store.getAccountById(studentId);

    if (!account) {
      throw new AppError(
        'ACCOUNT_NOT_FOUND',
        404,
        'Account not found'
      );
    }

    const payload = { sub: studentId, deviceId: newDeviceId, role: 'student' };
    const accessToken = this.signJwt(payload, '15m');
    const refreshToken = this.signJwt({ ...payload, isRefresh: true }, '7d');

    this.store.switchDevice(studentId, oldDeviceId, newDeviceId, accessToken, refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      tokenType: 'Bearer',
      user: {
        id: account.studentId,
        rollNumber: account.rollNumber,
        email: account.email,
        role: 'student',
      },
    };
  }
}
