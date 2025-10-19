import { NextRequest } from 'next/server';
import { AuthController } from '@/layers/controllers/AuthController';
import { handleError } from '@/exceptions/handlerError';

const authController = new AuthController();

export async function POST(request: NextRequest) {
  try {
    return await authController.register(request);
  } catch (error) {
    return handleError(error);
  }
}