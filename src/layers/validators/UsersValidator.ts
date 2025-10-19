import { z } from 'zod';
import { ValidationError } from '@/exceptions/ValidationError';

// Schema untuk create user
export const CreateUserSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(255, "Nama maksimal 255 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  phone: z.string().optional(),
  address: z.string().max(500).optional(),
  role: z.string().optional(),
});

// Schema untuk update user
export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  email: z.string().email("Format email tidak valid").optional(),
  password: z.string().min(8, "Password minimal 8 karakter").optional(),
  phone: z.string().optional(),
  address: z.string().max(500).optional(),
  role: z.string().optional(),
});

// Tipe data yang diterima
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

// Helper untuk validasi
export function validateCreateUser(data: unknown): CreateUserInput {
  const result = CreateUserSchema.safeParse(data);
  if (!result.success) {
    // Gunakan flatten() untuk ambil message
    const errors = result.error.flatten().fieldErrors;
    const errorMessages = Object.values(errors)
      .flat()
      .join(', ');
    throw new ValidationError(errorMessages);
  }
  return result.data;
}

export function validateUpdateUser(data: unknown): UpdateUserInput {
  const result = UpdateUserSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const errorMessages = Object.values(errors)
      .flat()
      .join(', ');
    throw new ValidationError(errorMessages);
  }
  return result.data;
}
