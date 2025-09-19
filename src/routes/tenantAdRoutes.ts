import { Router } from "express";
import { tenantAdController } from "../controller/tenantAdController";
import { jwtAuth } from "../middleware/jwtAuth";
import { roleAuthorization } from "../middleware/roleAuthorization";
import { Role } from "../types/Role";

const router = Router();

// Create a new tenant ad setting (Admin only)
router.post(
  "/",
  jwtAuth(),
  roleAuthorization([Role.ADMIN]),
  tenantAdController.createTenantAd
);

// Get all tenant ads for the current tenant
router.get(
  "/",
  jwtAuth(),
  roleAuthorization([Role.ADMIN]),
  tenantAdController.getTenantAds
);

// Get a specific tenant ad by ID
router.get(
  "/:id",
  jwtAuth(),
  roleAuthorization([Role.ADMIN]),
  tenantAdController.getTenantAdById
);

// Update an existing tenant ad
router.put(
  "/:id",
  jwtAuth(),
  roleAuthorization([Role.ADMIN]),
  tenantAdController.updateTenantAd
);

// Delete a tenant ad
router.delete(
  "/:id",
  jwtAuth(),
  roleAuthorization([Role.ADMIN]),
  tenantAdController.deleteTenantAd
);

// Get tenant ads for a specific page type (protected route)
router.get(
  "/page/:pageType",
  jwtAuth(),
  roleAuthorization([Role.ADMIN]),
  tenantAdController.getTenantAdsForPage
);

export default router;
