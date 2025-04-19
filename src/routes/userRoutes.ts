// src/routes/userRoutes.ts
import { Router } from "express";
import * as userController from "../controller/userController";
import { jwtAuth } from "../middleware/jwtAuth";
import { roleAuthorization } from "../middleware/roleAuthorization";
import { Role } from "../types/UserTypes";

const router = Router();


// Other routes can be protected as needed with dynamic role checks:
router.get("/",jwtAuth, roleAuthorization(Role.SUPER_ADMIN, Role.ADMIN), userController.getAllUsersController);
router.get("/:id", jwtAuth, userController.getUserByIdController);
router.put("/:id", jwtAuth, roleAuthorization(Role.SUPER_ADMIN, Role.ADMIN), userController.updateUserController);
router.delete("/:id", jwtAuth, roleAuthorization(Role.SUPER_ADMIN), userController.deleteUserController);

export default router;
