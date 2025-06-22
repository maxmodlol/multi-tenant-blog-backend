// src/controllers/siteSettingController.ts
import { Request, Response, NextFunction } from "express";
import {
  updateSiteSetting,
  getOrCreateSiteSetting,
} from "../services/siteSettingService";
import { ApiError } from "../utils/ApiError";
import { getTenantFromReq } from "../utils/getTenantFromReq";

export const getSiteSettingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Use req.hostname to drop any port number automatically.
    // On "publisher1.localhost:5000" → req.hostname === "publisher1.localhost"
    // On "localhost:5000" → req.hostname === "localhost"
    const tenant = (req as any).tenant;
    console.log("sdas", req.headers["x-tenant"]), tenant;

    console.log("tenant setting ", tenant);
    const setting = await getOrCreateSiteSetting(tenant);
    console.log("setting", setting);
    res.status(200).json(setting);
  } catch (err) {
    next(err);
  }
};

/**
 * Expects JSON body:
 * {
 *   id: string,
 *   logoLightUrl?: string,
 *   logoDarkUrl?: string,
 *   baseColor: "H S% L%"
 * }
 */
export const updateSiteSettingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    // Again, pull tenant from req.hostname (not including port).
    const tenant = getTenantFromReq(req);
    console.log("🔧 [updateSiteSetting] tenant =", tenant);
    const id = req.body.id;
    if (!id) {
      return res.status(400).json({ error: "id body is required" });
    }

    const { logoLightUrl, logoDarkUrl, baseColor } = req.body;
    if (!baseColor || typeof baseColor !== "string") {
      return res.status(400).json({ error: "baseColor is required" });
    }

    const updates: any = { baseColor };
    if (typeof logoLightUrl === "string") updates.logoLightUrl = logoLightUrl;
    if (typeof logoDarkUrl === "string") updates.logoDarkUrl = logoDarkUrl;

    const updated = await updateSiteSetting(tenant, id, updates);
    res.status(200).json(updated);
  } catch (err) {
    if (err instanceof ApiError) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
};
