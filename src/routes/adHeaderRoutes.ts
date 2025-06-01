// src/routes/adHeaderRoutes.ts
import { Router } from "express";
import {
  getAdHeaderController,
  upsertAdHeaderController,
} from "../controller/adHeaderController";
import tenantMiddleware from "../middleware/tenantMiddleware";
import { jwtAuth } from "../middleware/jwtAuth";

const router = Router();
router.use(tenantMiddleware);
router.use(jwtAuth());

router.get("/", getAdHeaderController);
router.post("/", upsertAdHeaderController);
export default router;
