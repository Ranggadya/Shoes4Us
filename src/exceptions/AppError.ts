export class AppError extends Error {
  public errors?: Record<string, string[]> | null;

  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    errors?: Record<string, string[]> | null
  ) {
    super(message);
    this.name = 'AppError';
    this.errors = errors;
  }
}
