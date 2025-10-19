import { AppError } from './AppError';

export class AuthError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 401, code);
    this.name = 'AuthError';
  }
}
