// src/controllers/uploadController.ts
import { Request, Response, NextFunction } from "express";
import { MulterS3File } from "../types/blogsType";

/**
 * After multer-s3 processes `upload.single("file")`, req.file is a MulterS3File.
 * We simply return its `.location` as `{ url }`.
 */
export const uploadImageController = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const file = req.file as MulterS3File | undefined;
    if (!file || typeof file.location !== "string") {
      res.status(400).json({ error: "No file uploaded or invalid file" });
      return;
    }
    // Send back the S3 URL
    res.status(200).json({ url: file.location });
  } catch (err) {
    next(err);
  }
};
