import { Request, Response, NextFunction } from "express";
import { leadService } from "../service/lead.service";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
} from "../../../shared/response/api-response";

export const leadController = {
  create: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const lead = await leadService.createLead(req.body);
      sendCreated(res, lead, "Lead created and jobs queued");
    } catch (error) {
      next(error);
    }
  },
  getAll: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const leads = await leadService.getAllLeads();
      sendSuccess(res, leads, "Leads fetched successfully");
    } catch (error) {
      next(error);
    }
  },

  getById: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const lead = await leadService.getLeadById(req.params.id as string);
      sendSuccess(res, lead, "Lead fetched successfully");
    } catch (error) {
      next(error);
    }
  },

  update: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const lead = await leadService.updateLead(
        req.params.id as string,
        req.body,
      );
      sendSuccess(res, lead, "Lead updated successfully");
    } catch (error) {
      next(error);
    }
  },

  delete: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await leadService.deleteLead(req.params.id as string);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  },
};
