// src/controller/userController.ts
import { RequestHandler } from "express";
import {
  listUsersForTenant,
  createUserWithRole,
  deleteUserFromTenant,
  updateUserWithRole,
} from "../services/userService";
import { Role } from "../types/Role";
import { getTenantFromReq } from "../utils/getTenantFromReq";
import { AppDataSource } from "../config/data-source";
import { User } from "../models/User";

// GET /api/settings/users
// Supports optional ?tenant={slug|all} for main-admins
export const listUsersController: RequestHandler = async (req, res, next) => {
  try {
    // For non-admin tenants, always scoped to current tenant from host/header
    const currentDomain = getTenantFromReq(req);
    const requested = (req.query.tenant as string | undefined)
      ?.trim()
      .toLowerCase();

    const actorsTenant = req.user?.tenant ?? currentDomain;
    const isMainAdmin =
      req.user?.role === Role.ADMIN && actorsTenant === "main";

    if (!isMainAdmin || !requested || requested === "current") {
      const members = await listUsersForTenant(currentDomain);
      res.json({ members });
      return;
    }

    // Main admin can aggregate across a specific tenant or all tenants
    if (requested === "all") {
      const { listTenants } = await import("../services/tenantService");
      const tenants = await listTenants();
      const all: any[] = [];
      for (const t of tenants) {
        const m = await listUsersForTenant(t.domain);
        // include tenant in each row (already present as tenant)
        all.push(...m);
      }
      res.json({ members: all });
      return;
    }

    // Specific tenant filter
    const members = await listUsersForTenant(requested);
    res.json({ members });
  } catch (err) {
    next(err);
  }
};

// POST /api/settings/users
export const createUserController: RequestHandler = async (req, res, next) => {
  try {
    const currentDomain = getTenantFromReq(req);
    const { name, email, password, role, domain } = req.body ?? {};

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // 1) Validate role (allow ADMIN_HELPER for main-admin usage)
    if (![Role.PUBLISHER, Role.EDITOR, Role.ADMIN_HELPER].includes(role)) {
      res
        .status(400)
        .json({ error: "role must be PUBLISHER, EDITOR, or ADMIN_HELPER" });
      return; // exit without returning res.json()
    }

    // 2) Determine target domain
    const targetDomain =
      role === Role.PUBLISHER
        ? domain
        : role === Role.ADMIN_HELPER
          ? "main"
          : currentDomain;

    if (role === Role.PUBLISHER && !domain) {
      res
        .status(400)
        .json({ error: "Please select a tenant for the publisher" });
      return;
    }

    // 3) Permission checks
    const requesterTenant = req.user!.tenant;
    if (role === Role.PUBLISHER && requesterTenant !== "main") {
      res.status(403).json({ error: "Only main-admins can create publishers" });
      return;
    }
    if (role === Role.ADMIN_HELPER && requesterTenant !== "main") {
      res.status(403).json({ error: "Only main-admins can create helpers" });
      return;
    }
    if (
      role === Role.EDITOR &&
      req.user?.role !== Role.ADMIN &&
      requesterTenant !== targetDomain
    ) {
      res.status(403).json({ error: "Cannot invite to a different tenant" });
      return;
    }

    // 4) Create user + link
    const { user, link } = await createUserWithRole(
      name,
      email,
      password,
      role,
      targetDomain
    );

    // 5) Respond (no return)
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || null,
      dateAdded: user.createdAt.toISOString(),
      role: link.role,
      domain: link.tenant,
    });
    return; // optional, just to end the function
  } catch (err) {
    next(err);
  }
};
//put
export const updateUserController: RequestHandler = async (req, res, next) => {
  try {
    const currentTenant = getTenantFromReq(req);
    const { userId } = req.params;
    const { name, email, password, role, domain } = req.body ?? {};

    // 1) Validate role if provided
    if (role && ![Role.PUBLISHER, Role.EDITOR].includes(role)) {
      res.status(400).json({ error: "role must be PUBLISHER or EDITOR" });
      return;
    }

    // 3) Perform update
    const { user, link } = await updateUserWithRole(
      userId,
      { name, email, password, role, domain },
      currentTenant
    );

    // 4) Respond with updated DTO (no return!)
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || null,
      dateAdded: user.createdAt.toISOString(),
      role: link.role,
      domain: link.tenant,
    });
    // end of handler → implicitly returns undefined
  } catch (err) {
    next(err);
  }
};
// DELETE /api/settings/users/:userId
export const deleteUserController: RequestHandler = async (req, res, next) => {
  try {
    const domain = getTenantFromReq(req);
    await deleteUserFromTenant(req.params.userId, domain);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

// GET /api/settings/users/check?email=
export const checkEmailAvailability: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const email = (req.query.email as string | undefined)?.trim().toLowerCase();
    if (!email) {
      res.status(400).json({ error: "email is required" });
      return;
    }
    const repo = AppDataSource.getRepository(User);
    const exists = await repo.findOne({ where: { email } });
    res.json({ available: !exists });
  } catch (err) {
    next(err);
  }
};
