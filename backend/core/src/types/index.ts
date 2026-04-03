// Shared types - expand as needed
export interface User {
  id: string;
  role: 'student' | 'security' | 'admin';
  email?: string;
  status?: AccountStatus;
}

export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
}

// Auth domain types
export type AccountStatus = 'pending' | 'active';

export interface StudentAccount {
  studentId: string;
  rollNumber: string;
  email: string;
  password: string; // plain text in mock, will be hashed later
  status: AccountStatus;
  activationToken?: string;
}

export interface Session {
  id: string;
  studentId: string;
  deviceId: string;
  accessToken: string;
  refreshToken: string;
  createdAt: Date;
  expiresAt: Date;
}

// Custom error class for app-level errors
export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}