// src/controllers/adSettingController.ts

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
  next: NextFunction,
): Promise<void> => {
  try {
    // no tenant—blogId alone
    const blogId = req.query.blogId as string | undefined;
    if (!blogId) {
      res.status(400).json({ error: "blogId query parameter is required" });
      return;
    }
    const ads = await getAdSettings(blogId);
    res.status(200).json(ads);
  } catch (err) {
    next(err);
  }
};

export const createAdSettingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      blogId,
      placement,
      appearance,
      codeSnippet,
      isEnabled,
      positionOffset,
    } = req.body;
    if (!blogId || !placement || !appearance || !codeSnippet) {
      res.status(400).json({
        error: "blogId, placement, appearance, and codeSnippet are required",
      });
      return;
    }
    const ad = await createAdSetting(blogId, {
      placement,
      appearance,
      codeSnippet,
      isEnabled,
      positionOffset,
    });
    res.status(201).json(ad);
  } catch (err) {
    next(err);
  }
};

export const updateAdSettingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { placement, appearance, codeSnippet, isEnabled, positionOffset } =
      req.body;
    console.log("req");
    const id = req.params.id;

    if (!id) {
      res.status(400).json({ error: "blogId is required in body" });
      return;
    }
    const updated = await updateAdSetting(id, {
      placement,
      appearance,
      codeSnippet,
      isEnabled,
      positionOffset,
    });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteAdSettingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const blogId = req.query.blogId as string | undefined;
    const id = req.params.id;
    if (!blogId) {
      res.status(400).json({ error: "blogId query parameter is required" });
      return;
    }
    await deleteAdSetting(blogId, id);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};
