import { Router } from "express";
import { leadController } from "../controller/lead.controller";
import { validate } from "../../../shared/middlewares/validate.middleware";
import { CreateLeadDto, UpdateLeadDto, LeadIdParamDto } from "../dto/lead.dto";

const router = Router();

router.post("/leads", validate(CreateLeadDto), leadController.create);
router.get("/leads", leadController.getAll);
router.get(
  "/leads/:id",
  validate(LeadIdParamDto, "params"),
  leadController.getById,
);
router.patch(
  "/leads/:id",
  validate(LeadIdParamDto, "params"),
  validate(UpdateLeadDto),
  leadController.update,
);
router.delete(
  "/leads/:id",
  validate(LeadIdParamDto, "params"),
  leadController.delete,
);

export default router;
