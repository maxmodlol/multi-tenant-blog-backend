// src/middleware/upload.ts
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// General upload configuration (for logos, blog images, etc.)
export const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET_NAME!,
    contentType: multerS3.AUTO_CONTENT_TYPE, // 👈 2) keep image/svg+xml, etc.
    cacheControl: "public,max-age=31536000", //    (optional) long-term caching
    key: (_req, file, cb) => {
      const ext = file.originalname.split(".").pop(); // png | svg | …
      cb(null, `logos/${randomUUID()}.${ext}`); // e.g. logos/a1b2.svg
    },
  }),
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "image/x-icon",
      "image/vnd.microsoft.icon",
    ];
    cb(null, allowed.includes(file.mimetype));
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB limit — adjust as you like
});

// Avatar upload configuration (no size limit, accepts all image types)
export const avatarUpload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET_NAME!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    cacheControl: "public,max-age=31536000",
    key: (_req, file, cb) => {
      const ext = file.originalname.split(".").pop();
      cb(null, `avatars/${randomUUID()}.${ext}`); // Store avatars in separate folder
    },
  }),
  fileFilter: (_req, file, cb) => {
    // Accept any image type
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  // Very generous file size limit for avatars
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
});

// Video upload configuration (accepts video files)
export const videoUpload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET_NAME!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    cacheControl: "public,max-age=31536000",
    key: (_req, file, cb) => {
      const ext = file.originalname.split(".").pop();
      cb(null, `videos/${randomUUID()}.${ext}`); // Store videos in separate folder
    },
  }),
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/avi",
      "video/mov",
      "video/quicktime",
      "video/x-msvideo",
    ];
    cb(null, allowed.includes(file.mimetype));
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit for videos
});
