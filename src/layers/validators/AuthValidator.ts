import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token tidak boleh kosong"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});