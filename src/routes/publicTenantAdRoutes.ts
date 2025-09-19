import { Router } from "express";
import { tenantAdController } from "../controller/tenantAdController";

const publicTenantAdRouter = Router();

// Get tenant ads for a specific page type (public access)
publicTenantAdRouter.get(
  "/page/:pageType",
  tenantAdController.getPublicTenantAdsForPage
);

export default publicTenantAdRouter;
