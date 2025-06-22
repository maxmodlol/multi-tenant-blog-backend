import { Router } from "express";
import {
  loginController,
  meController, // 👈 new
  logoutController, // 👈 new
} from "../controller/authController";
import { jwtAuth } from "../middleware/jwtAuth";

const router = Router();

// login
router.post("/login", loginController);

// ── NEW endpoints ────────────────────────────────────────────────────────
router.get("/me", jwtAuth(), meController); // needs a valid cookie

router.post("/logout", jwtAuth(false), logoutController);
// ─────────────────────────────────────────────────────────────────────────

export default router;
