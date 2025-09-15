// controller/authController.ts
import { Request, RequestHandler, Response } from "express";
import bcrypt from "bcrypt";
import {
  findUserWithRole,
  createPasswordResetToken,
  verifyResetToken,
  consumeResetTokenAndUpdatePassword,
} from "../services/userService";
import { getTenantFromReq } from "../utils/getTenantFromReq";
import { serialize } from "cookie";
import { signJWT, COOKIE_NAME, COOKIE_TTL } from "../utils/jwt";
import { sendResetEmail } from "../utils/mailer";

// POST /main/auth/login

export async function loginController(req: Request, res: Response) {
  const tenant = getTenantFromReq(req);
  const { email, password } = req.body;

  const found = await findUserWithRole(email, tenant);
  if (!found) {
    res.status(401).json({ error: "Not Found" });
    return;
  }

  const { user, link } = found;

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    res.status(401).json({ error: "Bad credentials" });
    return;
  }

  const token = signJWT(user.id, user.email, link.role, link.tenant);

  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: COOKIE_TTL,
      path: "/",
      domain: process.env.MAIN_DOMAIN || "localhost",
    })
  );

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: link.role,
      tenant: link.tenant,
    },
    token,
  });
}

export const meController: RequestHandler = (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return; // ← early exit
  }

  const { sub: id, email, role, tenant } = req.user;
  res.json({ id, email, role, tenant }); // ← no “return”
};

/* ------------------------------------------------------------------ */
/* POST /api/auth/logout  – clear cookie                              */
/* ------------------------------------------------------------------ */
export const logoutController: RequestHandler = (_req, res) => {
  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 0, // expire immediately
      path: "/",
      domain: process.env.MAIN_DOMAIN || "localhost",
    })
  );
  res.status(204).end(); // 204 No-Content
};

/* ------------------------------------------------------------------ */
/* POST /api/auth/forgot-password                                      */
/* body: { email: string }                                             */
/* ------------------------------------------------------------------ */
export const forgotPasswordController: RequestHandler = async (
  req,
  res
): Promise<void> => {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const created = await createPasswordResetToken(email);
  // Always respond OK to avoid leaking whether email exists
  if (created) {
    const tenant = getTenantFromReq(req);
    const baseUrl =
      process.env.FRONTEND_URL ||
      `https://${tenant}.${process.env.MAIN_DOMAIN}`;
    const link = `${baseUrl}/reset-password?token=${created.token}`;
    await sendResetEmail(email, link);
  }
  res.json({ ok: true });
};

/* ------------------------------------------------------------------ */
/* POST /api/auth/reset-password                                       */
/* body: { token: string, password: string }                           */
/* ------------------------------------------------------------------ */
export const resetPasswordController: RequestHandler = async (
  req,
  res
): Promise<void> => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || !password) {
    res.status(400).json({ error: "Token and new password are required" });
    return;
  }

  const verified = await verifyResetToken(token);
  if (!verified) {
    res.status(400).json({ error: "Invalid or expired token" });
    return;
  }

  const ok = await consumeResetTokenAndUpdatePassword(
    verified.record.id,
    password
  );
  if (!ok) {
    res.status(400).json({ error: "Unable to reset password" });
    return;
  }
  res.json({ ok: true });
};
