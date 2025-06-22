// src/routes/siteSettingRoutes.ts

import { Router } from "express";
import {
  getSiteSettingController,
  updateSiteSettingController,
} from "../controller/siteSettingController";
import { jwtAuth } from "../middleware/jwtAuth";
import { roleAuthorization } from "../middleware/roleAuthorization";
import { Role } from "../types/Role";

const router = Router();

// Publicly readable: any visitor (no auth) can fetch the tenant’s colors & logos
router.get("/", getSiteSettingController);

// Only an ADMIN in that tenant can change them
router.put("/", jwtAuth(), updateSiteSettingController);

export default router;
