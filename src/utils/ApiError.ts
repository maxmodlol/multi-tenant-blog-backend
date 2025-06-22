// src/utils/ApiError.ts
export class ApiError extends Error {
  public status: number;
  public errors?: any;

  constructor(status: number, message: string, errors?: any) {
    super(message);
    this.status = status;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export const formatError = (error: any) => {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      status: error.status,
      errors: error.errors,
    };
  }
  return { message: error.message || "Internal Server Error", status: 500 };
};
