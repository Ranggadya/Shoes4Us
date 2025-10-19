// src/layers/utils/responseHandler.ts
import { ZodError, ZodIssue } from 'zod';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { AppError } from '@/exceptions/AppError';

export interface ApiError {
  success: false;
  message: string;
  code?: string;
  errors?: Record<string, string[]> | Record<string, unknown> | null;
  statusCode: number;
}

export function handleError(error: unknown): NextResponse<ApiError> {
  console.error('Error occurred:', error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const errors: Record<string, string[]> = {};

    error.issues.forEach((err: ZodIssue) => {
      const path = err.path.join('.') || 'root';
      if (!errors[path]) errors[path] = [];
      errors[path].push(err.message);
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors,
        statusCode: 400,
      },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        code: error.code ?? 'APP_ERROR',
        errors: error.errors ?? null,
        statusCode: error.statusCode ?? 400,
      },
      { status: error.statusCode ?? 400 }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    let message = 'Database error occurred';
    let code = 'PRISMA_ERROR';
    let statusCode = 500;
    const errorDetails: Record<string, unknown> | null = error.meta ?? null;

    switch (error.code) {
      case 'P2002':
        message = 'Duplicate entry. Record already exists.';
        code = 'UNIQUE_CONSTRAINT_VIOLATION';
        statusCode = 409;
        break;
      case 'P2025':
        message = 'Record not found';
        code = 'NOT_FOUND';
        statusCode = 404;
        break;
      case 'P2003':
        message = 'Foreign key constraint failed';
        code = 'FOREIGN_KEY_CONSTRAINT';
        statusCode = 400;
        break;
    }

    return NextResponse.json(
      {
        success: false,
        message,
        code,
        errors: errorDetails,
        statusCode,
      },
      { status: statusCode }
    );
  }

  return NextResponse.json(
    {
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: 500,
    },
    { status: 500 }
  );
}

export function createSuccessResponse<T>(data: T, message: string = 'Success') {
  return NextResponse.json({
    success: true,
    message,
    data,
  });
}
