// src/controller/adSettingController.ts
import { Request, Response, NextFunction } from "express";
import {
  createAdSetting,
  getAdSettings,
  updateAdSetting,
  deleteAdSetting,
} from "../services/adSettingService";

export const listAdSettingsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenant = (req as any).tenant;
    const blogId = req.query.blogId as string | undefined;
    const ads = await getAdSettings(tenant, blogId);
    res.status(200).json(ads);
  } catch (err) {
    next(err);
  }
};

export const createAdSettingController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenant = (req as any).tenant;
    const input = req.body;
    const ad = await createAdSetting(tenant, input);
    res.status(201).json(ad);
  } catch (err) {
    next(err);
  }
};

export const updateAdSettingController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenant = (req as any).tenant;
    const id = req.params.id;
    const updates = req.body;
    const updated = await updateAdSetting(tenant, id, updates);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteAdSettingController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenant = (req as any).tenant;
    const id = req.params.id;
    await deleteAdSetting(tenant, id);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};
