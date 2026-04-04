// // import { randomUUID } from 'crypto';
// // import { StudentAccount, Session, AppError } from '@nexus/core';

// // export class MockAuthStore {
// //   private accounts: Map<string, StudentAccount> = new Map();
// //   private sessions: Map<string, Session> = new Map(); // token -> session
// //   private accountSessions: Map<string, Session> = new Map(); // "studentId:deviceId" -> session

// //   constructor() {
// //     this.seed();
// //   }

// //   private seed(): void {
// //     const account1: StudentAccount = {
// //       studentId: 'std_001',
// //       rollNumber: 'CS21001',
// //       email: 'cs21001@campus.edu',
// //       password: 'pass123',
// //       status: 'pending',
// //       activationToken: 'activation_token_001',
// //     };

// //     const account2: StudentAccount = {
// //       studentId: 'std_002',
// //       rollNumber: 'CS21002',
// //       email: 'cs21002@campus.edu',
// //       password: 'pass456',
// //       status: 'active',
// //     };

// //     this.accounts.set(account1.studentId, account1);
// //     this.accounts.set(account2.studentId, account2);
// //   }

// //   getAccountByEmailOrRollNumber(identifier: string): StudentAccount | null {
// //     for (const account of this.accounts.values()) {
// //       if (account.email === identifier || account.rollNumber === identifier) {
// //         return account;
// //       }
// //     }
// //     return null;
// //   }

// //   getAccountById(studentId: string): StudentAccount | null {
// //     return this.accounts.get(studentId) || null;
// //   }

// //   getAccountByActivationToken(token: string): StudentAccount | null {
// //     for (const account of this.accounts.values()) {
// //       if (account.activationToken === token) {
// //         return account;
// //       }
// //     }
// //     return null;
// //   }

// //   activateAccountByToken(
// //     token: string,
// //     newPassword: string
// //   ): StudentAccount {
// //     const account = this.getAccountByActivationToken(token);

// //     if (!account) {
// //       throw new AppError(
// //         'INVALID_ACTIVATION_TOKEN',
// //         400,
// //         'Invalid activation token'
// //       );
// //     }

// //     if (account.status === 'active') {
// //       throw new AppError(
// //         'ALREADY_ACTIVATED',
// //         409,
// //         'Account is already activated'
// //       );
// //     }

// //     account.status = 'active';
// //     account.activationToken = undefined;
// //     account.password = newPassword;

// //     return account;
// //   }

// //   validatePassword(account: StudentAccount, password: string): boolean {
// //     return account.password === password;
// //   }

// //   createSession(studentId: string, deviceId: string): Session {
// //     const id = randomUUID();
// //     const accessToken = randomUUID();
// //     const refreshToken = randomUUID();
// //     const now = new Date();
// //     const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes

// //     const session: Session = {
// //       id,
// //       studentId,
// //       deviceId,
// //       accessToken,
// //       refreshToken,
// //       createdAt: now,
// //       expiresAt,
// //     };

// //     this.sessions.set(accessToken, session);
// //     this.sessions.set(refreshToken, session);
// //     this.accountSessions.set(`${studentId}:${deviceId}`, session);

// //     return session;
// //   }

// //   getSessionByAccessToken(token: string): Session | null {
// //     return this.sessions.get(token) || null;
// //   }

// //   hasActiveDeviceSession(studentId: string): boolean {
// //     for (const key of this.accountSessions.keys()) {
// //       if (key.startsWith(studentId + ':')) {
// //         return true;
// //       }
// //     }
// //     return false;
// //   }

// //   getActiveDeviceSession(studentId: string): Session | null {
// //     for (const [key, session] of this.accountSessions.entries()) {
// //       if (key.startsWith(studentId + ':')) {
// //         return session;
// //       }
// //     }
// //     return null;
// //   }

// //   invalidateSession(accessToken: string): void {
// //     const session = this.sessions.get(accessToken);
// //     if (session) {
// //       this.sessions.delete(accessToken);
// //       this.sessions.delete(session.refreshToken);
// //       this.accountSessions.delete(`${session.studentId}:${session.deviceId}`);
// //     }
// //   }

// //   switchDevice(
// //     studentId: string,
// //     oldDeviceId: string,
// //     newDeviceId: string
// //   ): { oldSession: Session; newSession: Session } {
// //     const oldSessionKey = `${studentId}:${oldDeviceId}`;
// //     const oldSession = this.accountSessions.get(oldSessionKey);

// //     if (!oldSession) {
// //       throw new AppError(
// //         'DEVICE_SWITCH_MISMATCH',
// //         400,
// //         'No active session found for old device'
// //       );
// //     }

// //     // Invalidate old session
// //     this.invalidateSession(oldSession.accessToken);

// //     // Create new session
// //     const newSession = this.createSession(studentId, newDeviceId);

// //     return { oldSession, newSession };
// //   }
// // }

// import { randomUUID } from 'crypto';
// import { StudentAccount, Session, AppError } from '@nexus/core';

// export class MockAuthStore {
//   private accounts: Map<string, StudentAccount> = new Map();
//   private sessions: Map<string, Session> = new Map(); // token -> session
//   private accountSessions: Map<string, Session> = new Map(); // "studentId:deviceId" -> session

//   constructor() {
//     this.seed();
//   }

//   private seed(): void {
//     const account1: StudentAccount = {
//       studentId: 'std_001',
//       rollNumber: 'CS21001',
//       email: 'cs21001@campus.edu',
//       password: 'pass123',
//       status: 'pending',
//       activationToken: 'activation_token_001',
//     };

//     const account2: StudentAccount = {
//       studentId: 'std_002',
//       rollNumber: 'CS21002',
//       email: 'cs21002@campus.edu',
//       password: 'pass456',
//       status: 'active',
//     };

//     this.accounts.set(account1.studentId, account1);
//     this.accounts.set(account2.studentId, account2);
//   }

//   getAccountByEmailOrRollNumber(identifier: string): StudentAccount | null {
//     for (const account of this.accounts.values()) {
//       if (account.email === identifier || account.rollNumber === identifier) {
//         return account;
//       }
//     }
//     return null;
//   }

//   getAccountById(studentId: string): StudentAccount | null {
//     return this.accounts.get(studentId) || null;
//   }

//   getAccountByActivationToken(token: string): StudentAccount | null {
//     for (const account of this.accounts.values()) {
//       if (account.activationToken === token) {
//         return account;
//       }
//     }
//     return null;
//   }

//   activateAccountByToken(
//     token: string,
//     newPassword: string
//   ): StudentAccount {
//     const account = this.getAccountByActivationToken(token);

//     if (!account) {
//       throw new AppError(
//         'INVALID_ACTIVATION_TOKEN',
//         400,
//         'Invalid activation token'
//       );
//     }

//     if (account.status === 'active') {
//       throw new AppError(
//         'ALREADY_ACTIVATED',
//         409,
//         'Account is already activated'
//       );
//     }

//     account.status = 'active';
//     account.activationToken = undefined;
//     account.password = newPassword;

//     return account;
//   }

//   validatePassword(account: StudentAccount, password: string): boolean {
//     return account.password === password;
//   }

//   // UPDATED: Now accepts the signed tokens from AuthService instead of generating UUIDs
//   createSession(
//     studentId: string, 
//     deviceId: string, 
//     accessToken: string, 
//     refreshToken: string
//   ): Session {
//     const id = randomUUID(); // Session ID can remain a UUID
//     const now = new Date();
//     const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes

//     const session: Session = {
//       id,
//       studentId,
//       deviceId,
//       accessToken,
//       refreshToken,
//       createdAt: now,
//       expiresAt,
//     };

//     this.sessions.set(accessToken, session);
//     this.sessions.set(refreshToken, session);
//     this.accountSessions.set(`${studentId}:${deviceId}`, session);

//     return session;
//   }

//   getSessionByAccessToken(token: string): Session | null {
//     return this.sessions.get(token) || null;
//   }

//   hasActiveDeviceSession(studentId: string): boolean {
//     for (const key of this.accountSessions.keys()) {
//       if (key.startsWith(studentId + ':')) {
//         return true;
//       }
//     }
//     return false;
//   }

//   getActiveDeviceSession(studentId: string): Session | null {
//     for (const [key, session] of this.accountSessions.entries()) {
//       if (key.startsWith(studentId + ':')) {
//         return session;
//       }
//     }
//     return null;
//   }

//   invalidateSession(accessToken: string): void {
//     const session = this.sessions.get(accessToken);
//     if (session) {
//       this.sessions.delete(accessToken);
//       this.sessions.delete(session.refreshToken);
//       this.accountSessions.delete(`${session.studentId}:${session.deviceId}`);
//     }
//   }

//   // UPDATED: Now requires the newly signed tokens to pass down to createSession
//   switchDevice(
//     studentId: string,
//     oldDeviceId: string,
//     newDeviceId: string,
//     newAccessToken: string,
//     newRefreshToken: string
//   ): { oldSession: Session; newSession: Session } {
//     const oldSessionKey = `${studentId}:${oldDeviceId}`;
//     const oldSession = this.accountSessions.get(oldSessionKey);

//     if (!oldSession) {
//       throw new AppError(
//         'DEVICE_SWITCH_MISMATCH',
//         400,
//         'No active session found for old device'
//       );
//     }

//     // Invalidate old session
//     this.invalidateSession(oldSession.accessToken);

//     // Create new session using the provided JWTs
//     const newSession = this.createSession(studentId, newDeviceId, newAccessToken, newRefreshToken);

//     return { oldSession, newSession };
//   }
// }