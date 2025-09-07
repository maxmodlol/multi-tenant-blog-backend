import { Router } from "express";
import {
  loginController,
  meController, // 👈 new
  logoutController, // 👈 new
  forgotPasswordController,
  resetPasswordController,
} from "../controller/authController";
import { jwtAuth } from "../middleware/jwtAuth";
import { upload } from "../middleware/upload";
import { uploadImageController } from "../controller/uploadController";
import {
  updateMeProfile,
  changeMyPassword,
  getMeProfile,
} from "../controller/profileController";

const router = Router();

// login
router.post("/login", loginController);

// ── NEW endpoints ────────────────────────────────────────────────────────
router.get("/me", jwtAuth(), meController); // needs a valid cookie
router.get("/me/profile", jwtAuth(), getMeProfile); // get profile data
router.post("/logout", jwtAuth(false), logoutController);

// Password reset
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);

// Profile management
router.put("/me/profile", jwtAuth(), updateMeProfile);
router.post("/me/change-password", jwtAuth(), changeMyPassword);
router.post(
  "/me/avatar",
  jwtAuth(),
  upload.single("file"),
  uploadImageController,
); // upload avatar
// ─────────────────────────────────────────────────────────────────────────

export default router;
