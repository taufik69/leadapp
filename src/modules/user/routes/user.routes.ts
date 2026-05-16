import { Router } from "express";
import { userController } from "../controller/user.controller";
import { validate } from "../../../shared/middlewares/validate.middleware";
import { CreateUserDto, UpdateUserDto, UserIdParamDto } from "../dto/user.dto";

const router = Router();

router.get("/", userController.getAll);
router.get("/:id", validate(UserIdParamDto, "params"), userController.getById);
router.post("/", validate(CreateUserDto), userController.create);
router.patch("/:id", validate(UserIdParamDto, "params"), validate(UpdateUserDto), userController.update);
router.delete("/:id", validate(UserIdParamDto, "params"), userController.delete);

export default router;
