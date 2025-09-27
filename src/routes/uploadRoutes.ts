// src/routes/uploadRoutes.ts
import { Router } from "express";
import { upload, videoUpload } from "../middleware/upload";
import { uploadImageController } from "../controller/uploadController";
import { jwtAuth } from "../middleware/jwtAuth";

const router = Router();

// POST /api/uploadLogo
// - expects a single file in field "file"
// - multer-s3 stores it in S3 and sets `file.location` to the URL
// - uploadImageController returns { url: string }
router.post("/", jwtAuth(), upload.single("file"), uploadImageController);

// POST /api/upload/video
// - expects a single video file in field "file"
// - multer-s3 stores it in S3 and sets `file.location` to the URL
// - uploadImageController returns { url: string }
router.post(
  "/video",
  jwtAuth(),
  videoUpload.single("file"),
  uploadImageController
);

export default router;
