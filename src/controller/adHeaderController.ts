import { Request, Response, NextFunction } from "express";
import {
  getAdHeaderSetting,
  upsertAdHeaderSetting,
} from "../services/adHeaderService";

export const getAdHeaderController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenant = (req as any).tenant;
    const header = await getAdHeaderSetting(tenant);
    res.status(200).json(header);
  } catch (err) {
    next(err);
  }
};

export const upsertAdHeaderController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenant = (req as any).tenant;
    const { headerSnippet, isEnabled } = req.body;
    if (!headerSnippet) {
      res.status(400).json({ error: "headerSnippet is required" });
      return;
    }
    const saved = await upsertAdHeaderSetting(tenant, {
      headerSnippet,
      isEnabled,
    });
    res.status(200).json(saved);
  } catch (err) {
    next(err);
  }
};

export const deleteAdHeaderController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenant = (req as any).tenant;
    // Deleting the ad header setting is not implemented in the service.
    // If you want to implement it, you can add a delete method in the service.
    res.status(501).json({ error: "Not implemented" });
  } catch (err) {
    next(err);
  }
};
