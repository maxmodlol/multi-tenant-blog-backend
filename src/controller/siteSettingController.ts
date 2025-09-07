// src/controllers/siteSettingController.ts
import { Request, Response, NextFunction } from "express";
import {
  updateSiteSetting,
  getOrCreateSiteSetting,
} from "../services/siteSettingService";
import { ApiError } from "../utils/ApiError";
import { getTenantFromReq } from "../utils/getTenantFromReq";

/* ────────────────────────────────────────────────────────────────
 * GET (unchanged)
 * ────────────────────────────────────────────────────────────────*/
export const getSiteSettingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenant = (req as any).tenant ?? getTenantFromReq(req);
    const setting = await getOrCreateSiteSetting(tenant);
    res.status(200).json(setting);
  } catch (err) {
    next(err);
  }
};

/* ────────────────────────────────────────────────────────────────
 * PUT /settings/site
 * ────────────────────────────────────────────────────────────────*/
export const updateSiteSettingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const tenant = getTenantFromReq(req);
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "id body is required" });
    }

    /* -------- extract optional fields ---------- */
    const {
      siteTitle,
      siteDescription,
      siteIconUrl,
      logoLightUrl,
      logoDarkUrl,
      baseColor,
      headerStyle,
      headerColor,
    } = req.body as Record<string, unknown>;

    /* -------- build updates obj dynamically ---- */
    const updates: Record<string, unknown> = {};
    if (typeof siteTitle === "string") updates.siteTitle = siteTitle;
    if (typeof siteDescription === "string" || siteDescription === null)
      updates.siteDescription = siteDescription;
    if (typeof siteIconUrl === "string" || siteIconUrl === null)
      updates.siteIconUrl = siteIconUrl;
    if (typeof logoLightUrl === "string") updates.logoLightUrl = logoLightUrl;
    if (typeof logoDarkUrl === "string") updates.logoDarkUrl = logoDarkUrl;
    if (typeof baseColor === "string") updates.baseColor = baseColor;
    if (headerStyle === "gradient" || headerStyle === "solid")
      updates.headerStyle = headerStyle;
    if (typeof headerColor === "string" || headerColor === null)
      updates.headerColor = headerColor;

    /* hand off to service (which does strict validation) */
    const dto = await updateSiteSetting(tenant, id, updates);
    res.status(200).json(dto);
  } catch (err) {
    if (err instanceof ApiError) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
};
