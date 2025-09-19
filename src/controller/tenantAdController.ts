// src/controller/tenantAdController.ts

import { Request, Response } from "express";
import * as tenantAdService from "../services/tenantAdService";
import { getTenantFromReq } from "../utils/getTenantFromReq";
import { ApiError } from "../utils/ApiError";
import { TenantAdPlacement } from "../models/TenantAdSetting";

export const tenantAdController = {
  /**
   * Create a new tenant ad setting
   */
  async createTenantAd(req: Request, res: Response) {
    try {
      const { tenantId, ...adData } = req.body;

      if (!tenantId) {
        throw new ApiError(400, "Tenant ID is required in request body");
      }

      // Use the tenantId from the form (where the ad should be placed)
      const ad = await tenantAdService.createTenantAdSetting(tenantId, {
        tenantId,
        ...adData,
      });
      res.status(201).json(ad);
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.status).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  },

  /**
   * Get all tenant ads for the current tenant
   */
  async getTenantAds(req: Request, res: Response) {
    try {
      const tenantId = getTenantFromReq(req);

      if (!tenantId) {
        throw new ApiError(400, "Tenant ID is required");
      }

      // Get ads for the current tenant only
      const ads = await tenantAdService.getTenantAdSettings(tenantId);
      res.json(ads);
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.status).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  },

  /**
   * Get a specific tenant ad by ID
   */
  async getTenantAdById(req: Request, res: Response) {
    try {
      const tenantId = getTenantFromReq(req);
      const { id } = req.params;

      if (!tenantId) {
        throw new ApiError(400, "Tenant ID is required");
      }

      const ads = await tenantAdService.getTenantAdSettings(tenantId);
      const ad = ads.find((a: any) => a.id === id);

      if (!ad) {
        throw new ApiError(404, "Tenant ad not found");
      }

      res.json(ad);
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.status).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  },

  /**
   * Update an existing tenant ad
   */
  async updateTenantAd(req: Request, res: Response) {
    try {
      const tenantId = getTenantFromReq(req);
      const { id } = req.params;

      if (!tenantId) {
        throw new ApiError(400, "Tenant ID is required");
      }

      const ad = await tenantAdService.updateTenantAdSetting(
        tenantId,
        id,
        req.body
      );
      res.json(ad);
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.status).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  },

  /**
   * Delete a tenant ad
   */
  async deleteTenantAd(req: Request, res: Response) {
    try {
      const tenantId = getTenantFromReq(req);
      const { id } = req.params;

      if (!tenantId) {
        throw new ApiError(400, "Tenant ID is required");
      }

      await tenantAdService.deleteTenantAdSetting(tenantId, id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.status).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  },

  /**
   * Get tenant ads for a specific page type (used by frontend)
   */
  async getTenantAdsForPage(req: Request, res: Response) {
    try {
      const tenantId = getTenantFromReq(req);
      const { pageType } = req.params;
      const { placements } = req.query;

      if (!tenantId) {
        throw new ApiError(400, "Tenant ID is required");
      }

      let placementArray: TenantAdPlacement[] | undefined;
      if (placements && typeof placements === "string") {
        placementArray = placements.split(",") as TenantAdPlacement[];
      }

      const ads = await tenantAdService.getTenantAdsForPage(
        tenantId,
        pageType,
        placementArray
      );

      res.json(ads);
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.status).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  },

  /**
   * Get tenant ads for a specific page type (PUBLIC - no authentication required)
   */
  async getPublicTenantAdsForPage(req: Request, res: Response) {
    try {
      const { pageType } = req.params;
      const { placements, tenantId, blogId } = req.query;

      if (!tenantId || typeof tenantId !== "string") {
        throw new ApiError(400, "Tenant ID is required");
      }

      let placementArray: TenantAdPlacement[] | undefined;
      if (placements && typeof placements === "string") {
        placementArray = placements.split(",") as TenantAdPlacement[];
      }

      const ads = await tenantAdService.getTenantAdsForPage(
        tenantId,
        pageType,
        placementArray,
        blogId as string
      );

      res.json(ads);
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.status).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  },
};
