import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../types/http-status";
import { ZodError } from "zod";
import { Prisma } from "../../generated/prisma";

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void => {
  let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
  let message = "Internal server error";
  let errors: unknown;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof ZodError) {
    statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
    message = "Validation failed";
    errors = err.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = HttpStatus.BAD_REQUEST;
    message = getPrismaErrorMessage(err.code);
    errors = { code: err.code };
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = HttpStatus.BAD_REQUEST;
    message = "Database validation error";
  }

  const body: Record<string, unknown> = { success: false, message };
  if (errors) body.errors = errors;
  if (process.env.NODE_ENV === "development") body.stack = err.stack;

  res.status(statusCode).json(body);
};

const getPrismaErrorMessage = (code: string): string => {
  const messages: Record<string, string> = {
    P2002: "A record with this value already exists",
    P2003: "Foreign key constraint failed",
    P2025: "Record not found",
    P2014: "Relation violation",
  };
  return messages[code] ?? "Database error";
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(HttpStatus.NOT_FOUND).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};
