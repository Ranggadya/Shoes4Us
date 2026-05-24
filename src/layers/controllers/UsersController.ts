import { NextRequest } from "next/server";
import { UserService } from "../services/UsersService";
import { createSuccessResponse } from "@/exceptions/handlerError";
import { UnauthorizedError } from "@/exceptions/UnauthorizedError";
import { AppError } from "@/exceptions/AppError";

function assertCanManageUser(req: NextRequest, targetUserId: string) {
  const authUserId = req.headers.get("x-user-id");
  const authRole = req.headers.get("x-user-role");

  if (!authUserId) throw new UnauthorizedError();
  if (authUserId !== targetUserId && authRole !== "ADMIN") {
    throw new AppError("Anda tidak memiliki akses ke akun ini", 403, "FORBIDDEN");
  }
}

export class UsersController {
  static async getProfile(req: NextRequest) {
    const userId = req.headers.get("x-user-id");
    if (!userId) throw new UnauthorizedError();
    const user = await new UserService().getUserById(userId);
    return createSuccessResponse(user);
  }

  static async getAll() {
    const users = await new UserService().getAllUsers();
    return createSuccessResponse(users);
  }

  static async getById(_req: NextRequest, params: { id: string }) {
    const user = await new UserService().getUserById(params.id);
    return createSuccessResponse(user);
  }

  static async update(req: NextRequest, params: { id: string }) {
    assertCanManageUser(req, params.id);
    const body = await req.json();
    const user = await new UserService().updateUser(params.id, body);
    return createSuccessResponse(user);
  }

  static async changePassword(req: NextRequest, params: { id: string }) {
    assertCanManageUser(req, params.id);
    const body = await req.json();

    if (!body.currentPassword || !body.newPassword) {
      throw new AppError("Password saat ini dan password baru wajib diisi", 400, "VALIDATION_ERROR");
    }

    if (String(body.newPassword).length < 8) {
      throw new AppError("Password baru minimal 8 karakter", 400, "VALIDATION_ERROR");
    }

    if (body.currentPassword === body.newPassword) {
      throw new AppError("Password baru harus berbeda dari password saat ini", 400, "VALIDATION_ERROR");
    }

    const result = await new UserService().changePassword(
      params.id,
      body.currentPassword,
      body.newPassword
    );
    return createSuccessResponse(result, result.message);
  }

  static async delete(_req: NextRequest, params: { id: string }) {
    const result = await new UserService().deleteUser(params.id);
    return createSuccessResponse(result);
  }

  static async createUser(req: NextRequest) {
    const body = await req.json();
    const result = await new UserService().register(body.name || "User", body.email, body.password);
    return createSuccessResponse(result);
  }
}
