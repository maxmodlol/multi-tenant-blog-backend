// src/routes/adHeaderRoutes.ts
import { Router } from "express";
import {
  getAdHeaderController,
  upsertAdHeaderController,
} from "../controller/adHeaderController";
import { jwtAuth } from "../middleware/jwtAuth";
import { roleAuthorization } from "../middleware/roleAuthorization";
import { Role } from "../types/Role";

const router = Router();

// Only ADMIN can change or view this singleton

router.get("/", getAdHeaderController);
router.post(
  "/",
  jwtAuth(),
  roleAuthorization([Role.ADMIN]),
  upsertAdHeaderController,
);
export default router;
