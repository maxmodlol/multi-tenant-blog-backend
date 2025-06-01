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

// GET /api/settings/users
export const listUsersController: RequestHandler = async (req, res, next) => {
  try {
    const domain = getTenantFromReq(req);
    const members = await listUsersForTenant(domain);
    res.json({ members });
  } catch (err) {
    next(err);
  }
};

// POST /api/settings/users
export const createUserController: RequestHandler = async (req, res, next) => {
  try {
    const currentDomain = getTenantFromReq(req);
    const { name, email, password, role, domain } = req.body;

    // 1) Validate role
    if (![Role.PUBLISHER, Role.EDITOR].includes(role)) {
      res.status(400).json({ error: "role must be PUBLISHER or EDITOR" });
      return; // exit without returning res.json()
    }

    // 2) Determine target domain
    const targetDomain = role === Role.PUBLISHER ? domain : currentDomain;

    if (role === Role.PUBLISHER && !domain) {
      res.status(400).json({ error: "domain is required for publishers" });
      return;
    }

    // 3) Permission checks
    const requesterTenant = req.user!.tenant;
    if (role === Role.PUBLISHER && requesterTenant !== "main") {
      res.status(403).json({ error: "Only main-admins can create publishers" });
      return;
    }
    if (role === Role.EDITOR && requesterTenant !== targetDomain) {
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
    const { name, email, password, role, domain } = req.body;

    // 1) Validate role if provided
    if (role && ![Role.PUBLISHER, Role.EDITOR].includes(role)) {
      res.status(400).json({ error: "role must be PUBLISHER or EDITOR" });
      return;
    }

    // 2) Only allow editing within the same tenant
    if (domain && domain !== currentTenant) {
      res.status(403).json({ error: "Cannot move user to a different tenant" });
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
