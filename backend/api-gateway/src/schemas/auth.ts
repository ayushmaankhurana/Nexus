import { z } from 'zod';

export const ActivateRequestSchema = z.object({
  activationToken: z.string().min(1, 'Activation token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type ActivateRequest = z.infer<typeof ActivateRequestSchema>;

export const LoginRequestSchema = z.object({
  identifier: z.string().min(1, 'Roll number or email is required'),
  password: z.string().min(1, 'Password is required'),
  deviceId: z.string().min(1, 'Device ID is required'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LogoutRequestSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  deviceId: z.string().min(1, 'Device ID is required'),
});

export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;

export const DeviceSwitchRequestSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  oldDeviceId: z.string().min(1, 'Old device ID is required'),
  newDeviceId: z.string().min(1, 'New device ID is required'),
});

export type DeviceSwitchRequest = z.infer<typeof DeviceSwitchRequestSchema>;

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.literal('Bearer'),
  user: z.object({
    id: z.string(),
    rollNumber: z.string(),
    email: z.string().email(),
    // Replace z.literal('student') with this:
    role: z.string(), 
  }),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export const RefreshRequestSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
  deviceId: z.string().min(1, 'Device ID is required'),
});

export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;

export const CreateStudentRequestSchema = z.object({
  rollNumber: z.string().min(1, 'rollNumber is required'),
  email: z.string().email('valid email is required'),
  firstName: z.string().min(1, 'firstName is required'),
  lastName: z.string().min(1, 'lastName is required'),
  rfidTag: z.string().min(1).optional(),
});

export type CreateStudentRequest = z.infer<typeof CreateStudentRequestSchema>;

export const CreateStudentResponseSchema = z.object({
  id: z.string(),
  rollNumber: z.string(),
  email: z.string().email(),
  role: z.string(),
  status: z.string(),
  profile: z.object({
    firstName: z.string(),
    lastName: z.string(),
    rfidTag: z.string().optional(),
  }),
  activationToken: z.string().optional(),
});

export type CreateStudentResponse = z.infer<typeof CreateStudentResponseSchema>;

export const ProfileResponseSchema = z.object({
  id: z.string(),
  rollNumber: z.string(),
  email: z.string().email(),
  role: z.string(),
  status: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  rfidTag: z.string().nullable(),
});

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;