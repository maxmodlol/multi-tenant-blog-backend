// src/routes/userRoutes.ts
import { Router } from "express";
import {
  listUsersController,
  createUserController,
  deleteUserController,
  updateUserController,
} from "../controller/userController";
import { jwtAuth } from "../middleware/jwtAuth";
import { roleAuthorization } from "../middleware/roleAuthorization";
import { Role } from "../types/Role";

const router = Router();

// All three endpoints require ADMIN on this tenant
router.use(jwtAuth(), roleAuthorization([Role.ADMIN]));

router
  .get("/", listUsersController) // list non-admins in this tenant
  .post("/", createUserController) // create publisher/editor in this tenant
  .put("/:userId", updateUserController) // ← add
  .delete("/:userId", deleteUserController);

export default router;
