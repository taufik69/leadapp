import { Request, Response, NextFunction } from "express";
import { userService } from "../service/user.service";
import { sendSuccess, sendCreated, sendNoContent } from "../../../shared/response/api-response";
import { HttpStatus } from "../../../shared/types/http-status";

export const userController = {
  getAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await userService.getAllUsers();
      sendSuccess(res, users, "Users fetched successfully");
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await userService.getUserById(req.params.id);
      sendSuccess(res, user, "User fetched successfully");
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await userService.createUser(req.body);
      sendCreated(res, user, "User created successfully");
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      sendSuccess(res, user, "User updated successfully");
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await userService.deleteUser(req.params.id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  },
};
