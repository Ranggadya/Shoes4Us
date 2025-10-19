// src/layers/services/UserService.ts
import { prisma } from '@/lib/db';
import { BcryptUtil } from '@/lib/BcryptUtil';
import { AppError } from '@/exceptions/AppError';
import { SignJWT, jwtVerify } from 'jose';
import { Prisma, UserRole } from '@prisma/client';


const JWT_EXPIRES_IN = 60 * 60 * 24;

function getJwtSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET environment variable belum di-set');
    return new TextEncoder().encode(secret);
}

export class UserService {
    async register(name: string, email: string, password: string) {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) throw new AppError('Email sudah terdaftar', 400, 'EMAIL_EXISTS');

        const hashedPassword = await BcryptUtil.hashPassword(password);
        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword, role: 'USER' },
        });

        const { password: _, ...safeUser } = user;
        return safeUser;
    }

    async login(email: string, password: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new AppError('Email atau password salah', 401, 'INVALID_CREDENTIALS');

        if (!user.password) throw new AppError('Password tidak ditemukan', 500, 'PASSWORD_MISSING');

        const validPassword = await BcryptUtil.comparePassword(password, user.password);
        if (!validPassword) throw new AppError('Email atau password salah', 401, 'INVALID_CREDENTIALS');

        const token = await new SignJWT({ userId: user.id, role: user.role })
            .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
            .setExpirationTime(`${JWT_EXPIRES_IN}s`)
            .sign(getJwtSecret());

        const { password: _, ...safeUser } = user;
        return { user: safeUser, token };
    }


    /** Verify JWT token */
    async verifyToken(token: string) {
        try {
            const { payload } = await jwtVerify(token, getJwtSecret());
            return payload as { userId: string; role: string };
        } catch (err) {
            return null;
        }
    }

    /** Get user by ID */
    async getUserById(id: string) {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) throw new AppError('User tidak ditemukan', 404, 'USER_NOT_FOUND');

        const { password, ...safeUser } = user;
        return safeUser;
    }

    /** Get user by Email */
    async getUserByEmail(email: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const { password, ...safeUser } = user;
        return safeUser;
    }

    /** Get all users (admin only) */
    async getAllUsers() {
        return prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });
    }

    async updateUser(
        id: string,
        data: { name?: string; email?: string; password?: string; role?: string }
    ) {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) throw new AppError('User tidak ditemukan', 404, 'USER_NOT_FOUND');

        const updateData: Prisma.UserUpdateInput = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.password !== undefined) updateData.password = await BcryptUtil.hashPassword(data.password);

        if (data.role !== undefined) {
            if (!['USER', 'ADMIN'].includes(data.role)) {
                throw new AppError('Role tidak valid', 400, 'INVALID_ROLE');
            }
            updateData.role = data.role as UserRole;
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
        });

        const { password: _, ...safeUser } = updatedUser;
        return safeUser;
    }


    /** Delete user (admin only) */
    async deleteUser(id: string) {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) throw new AppError('User tidak ditemukan', 404, 'USER_NOT_FOUND');

        await prisma.user.delete({ where: { id } });
        return { message: 'User berhasil dihapus', userId: id };
    }
}
