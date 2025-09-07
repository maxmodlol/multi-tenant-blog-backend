// src/routes/tenantAdRoutes.ts

import { Router } from "express";
import { tenantAdController } from "../controller/tenantAdController";
import { jwtAuth } from "../middleware/jwtAuth";
import { roleAuthorization } from "../middleware/roleAuthorization";
import { Role } from "../types/Role";

const router = Router();

// PUBLIC ROUTES (no authentication required)
router.get(
  "/public/page/:pageType",
  tenantAdController.getPublicTenantAdsForPage,
);

// ADMIN ROUTES (authentication required)
router.use(jwtAuth());
router.use(roleAuthorization([Role.ADMIN]));

// CRUD operations for tenant ads (general routes first)
router.get("/", tenantAdController.getTenantAds);
router.post("/", tenantAdController.createTenantAd);
router.get("/:id", tenantAdController.getTenantAdById);
router.put("/:id", tenantAdController.updateTenantAd);
router.delete("/:id", tenantAdController.deleteTenantAd);

// Get ads for specific page context (specific routes last)
router.get("/page/:pageType", tenantAdController.getTenantAdsForPage);

export default router;
