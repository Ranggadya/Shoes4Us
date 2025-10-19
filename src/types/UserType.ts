import { UserRole } from '@prisma/client';

export interface RegisterInput {
  email: string;
  password?: string | null;
  name?: string;
  role?: UserRole;
  imageUrl?: string | null;    
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UserPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  imageUrl?: string | null;
}
