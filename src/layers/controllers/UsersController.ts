import { NextRequest } from "next/server";
import { UserService } from "@/layers/services/UsersService";
import { handleError, createSuccessResponse } from "@/exceptions/handlerError";
import { requireAuth, requireAdmin } from "@/lib/auth";
import {
  validateCreateUser,
  validateUpdateUser,
} from "@/layers/validators/UsersValidator";
import { ValidationError } from "@/exceptions/ValidationError";

const service = new UserService();

export class UsersController {
  /**
   * 🧍 REGISTER (Public)
   * POST /api/auth/register
   */
  static async register(req: NextRequest) {
    try {
      const body = await req.json();
      const parsed = validateCreateUser(body);

      const user = await service.register(
        parsed.name,
        parsed.email,
        parsed.password
      );

      return createSuccessResponse(user, "Registrasi berhasil");
    } catch (e) {
      return handleError(e);
    }
  }

  /**
   * 🔐 LOGIN (Public)
   * POST /api/auth/login
   */
  static async login(req: NextRequest) {
    try {
      const body = await req.json();

      if (!body.email || !body.password) {
        throw new ValidationError("Email dan password wajib diisi");
      }

      const result = await service.login(body.email, body.password);
      return createSuccessResponse(result, "Login berhasil");
    } catch (e) {
      return handleError(e);
    }
  }

  /**
   * 👤 GET PROFILE (User sendiri)
   * GET /api/users/me
   */
  static async getProfile(req: NextRequest) {
    try {
      const user = await requireAuth(req);
      const profile = await service.getUserById(user.userId);
      return createSuccessResponse(profile, "Profil berhasil diambil");
    } catch (e) {
      return handleError(e);
    }
  }

  /**
   * 👑 CREATE USER (Admin only)
   * POST /api/users
   */
  static async createUser(req: NextRequest) {
    try {
      await requireAdmin(req);
      const body = await req.json();
      const parsed = validateCreateUser(body);

      const user = await service.register(
        parsed.name,
        parsed.email,
        parsed.password
      );

      return createSuccessResponse(user, "User baru berhasil dibuat oleh admin");
    } catch (e) {
      return handleError(e);
    }
  }

  /**
   * 📋 GET ALL USERS (Admin only)
   * GET /api/users
   */
  static async getAll(req: NextRequest) {
    try {
      await requireAdmin(req);
      const users = await service.getAllUsers();
      return createSuccessResponse(users, "Daftar user berhasil diambil");
    } catch (e) {
      return handleError(e);
    }
  }

  /**
   * 🔍 GET USER BY ID (Admin only)
   * GET /api/users/:id
   */
  static async getById(req: NextRequest, params: { id: string }) {
    try {
      await requireAdmin(req);
      const user = await service.getUserById(params.id);
      return createSuccessResponse(user, "User berhasil ditemukan");
    } catch (e) {
      return handleError(e);
    }
  }

  /**
   * ✏️ UPDATE USER (Admin / User sendiri)
   * PATCH /api/users/:id
   */
  static async update(req: NextRequest, params: { id: string }) {
    try {
      const authUser = await requireAuth(req);
      const body = await req.json();
      const parsed = validateUpdateUser(body);

      if (authUser.role !== "ADMIN" && authUser.userId !== params.id) {
        throw new ValidationError("Tidak memiliki izin untuk mengubah data ini");
      }

      const updated = await service.updateUser(params.id, parsed);
      return createSuccessResponse(updated, "User berhasil diperbarui");
    } catch (e) {
      return handleError(e);
    }
  }

  /**
   * ❌ DELETE USER (Admin only)
   * DELETE /api/users/:id
   */
  static async delete(req: NextRequest, params: { id: string }) {
    try {
      await requireAdmin(req);
      const result = await service.deleteUser(params.id);
      return createSuccessResponse(result, "User berhasil dihapus");
    } catch (e) {
      return handleError(e);
    }
  }
}
