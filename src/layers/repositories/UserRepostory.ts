import { prisma } from '@/lib/prisma';
import { RegisterInput } from '@/types/UserType';
import { Prisma, UserRole } from '@prisma/client';

export type CreateUserData = RegisterInput & {
  password?: string | null;
  imageUrl?: string | null;
  role?: UserRole;
};

export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        isActive: true,
        createdAt: true,
        image: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async create(data: CreateUserData) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('Email sudah terdaftar');
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name || 'User',
        password: data.password ?? null,
        role: data.role || UserRole.USER,
        image: data.imageUrl || null,
        isActive: true, 
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        isActive: true,
        createdAt: true,
        image: true,
      },
    });
  }


  async update(id: string, data: Partial<Prisma.UserUpdateInput>) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }
  
  async softDelete(id: string) {
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.user.delete({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  }
}
