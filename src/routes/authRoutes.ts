// src/routes/authRoutes.ts
import { Router } from "express";
import { loginController, registerController } from "../controller/authController";
import { roleAuthorization } from "../middleware/roleAuthorization";
import { Role } from "../types/UserTypes";
import { jwtAuth } from "../middleware/jwtAuth";

const router = Router();

// POST /api/auth/register - create a new user and return a JWT
router.post("/register",jwtAuth,roleAuthorization(Role.SUPER_ADMIN, Role.ADMIN),
 registerController);

// POST /api/auth/login - authenticate and return a JWT
router.post("/login", loginController);

export default router;
