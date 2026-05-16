import { Response } from "express";
import { HttpStatus, HttpStatusCode } from "../types/http-status";

interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

interface ErrorResponse {
  success: false;
  message: string;
  errors?: unknown;
  stack?: string;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode: HttpStatusCode = HttpStatus.OK,
  meta?: Record<string, unknown>
): Response => {
  const body: SuccessResponse<T> = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message = "Created successfully"
): Response => sendSuccess(res, data, message, HttpStatus.CREATED);

export const sendNoContent = (res: Response): Response =>
  res.status(HttpStatus.NO_CONTENT).send();

export const sendError = (
  res: Response,
  message: string,
  statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR,
  errors?: unknown
): Response => {
  const body: ErrorResponse = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};
