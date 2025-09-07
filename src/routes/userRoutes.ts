// src/routes/userRoutes.ts
import { Router } from "express";
import {
  listUsersController,
  createUserController,
  deleteUserController,
  updateUserController,
  checkEmailAvailability,
} from "../controller/userController";
import { jwtAuth } from "../middleware/jwtAuth";
import { roleAuthorization } from "../middleware/roleAuthorization";
import { Role } from "../types/Role";

const router = Router();

// Publishers manage users within their tenant (invite EDITORs);
// Main ADMIN can manage across tenants and create PUBLISHERs.
router.use(jwtAuth());

router.get(
  "/",
  roleAuthorization([Role.ADMIN, Role.PUBLISHER]),
  listUsersController,
);

router.post(
  "/",
  roleAuthorization([Role.ADMIN, Role.PUBLISHER]),
  createUserController,
);

router.put(
  "/:userId",
  roleAuthorization([Role.ADMIN, Role.PUBLISHER]),
  updateUserController,
);

router.delete(
  "/:userId",
  roleAuthorization([Role.ADMIN, Role.PUBLISHER]),
  deleteUserController,
);

// Email availability (admin/publisher)
router.get(
  "/check",
  roleAuthorization([Role.ADMIN, Role.PUBLISHER]),
  checkEmailAvailability,
);

export default router;
