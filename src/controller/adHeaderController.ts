// src/controllers/adHeaderController.ts
import { Request, Response, NextFunction } from "express";
import {
  getAdHeaderSetting,
  upsertAdHeaderSetting,
} from "../services/adHeaderService";

export const getAdHeaderController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const header = await getAdHeaderSetting();
    res.status(200).json(header);
  } catch (err) {
    next(err);
  }
};

export const upsertAdHeaderController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { headerSnippet, isEnabled } = req.body;
    if (!headerSnippet) {
      res.status(400).json({ error: "headerSnippet is required" });
      return;
    }
    const saved = await upsertAdHeaderSetting({
      headerSnippet,
      isEnabled,
    });
    res.status(200).json(saved);
  } catch (err) {
    next(err);
  }
};
