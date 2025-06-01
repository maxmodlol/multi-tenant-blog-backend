// services/userService.ts  (public DS only)
import { User } from "../models/User";
import { TenantUser } from "../models/TenantUser";
import { AppDataSource } from "../config/data-source";
import bcrypt from "bcrypt";
import { Role } from "../types/Role";
import { provisionSubdomain } from "./subdomainService";
import { ApiError } from "../utils/ApiError";

// services/userService.ts

import { findTenantByDomain } from "./tenantService";
// …

export async function createUserWithRole(
  name: string,
  email: string,
  password: string,
  role: Role,
  domain: string
) {
  const userRepo = AppDataSource.getRepository(User);
  const linkRepo = AppDataSource.getRepository(TenantUser);

  // 0) Email unique
  if (await userRepo.findOne({ where: { email } })) {
    throw new ApiError(400, "That email is already registered");
  }

  // 1) If publisher, spin up a new Tenant record & subdomain
  if (role === Role.PUBLISHER) {
    await provisionSubdomain(domain);
  }

  // 2) Otherwise (and also after provisioning), make sure the domain exists
  const tenant = await findTenantByDomain(domain);
  if (!tenant) {
    throw new ApiError(400, `Tenant “${domain}” does not exist`);
  }

  // 3) Create the user
  const user = userRepo.create({
    name,
    email,
    password: await bcrypt.hash(password, 10),
  });
  await userRepo.save(user);

  // 4) Link into the tenant
  const link = linkRepo.create({
    tenant: domain,
    role,
    user,
    userId: user.id,
  });
  await linkRepo.save(link);

  return { user, link };
}

export async function findUserWithRole(email: string, tenant: string) {
  const userRepo = AppDataSource.getRepository(User);
  const linkRepo = AppDataSource.getRepository(TenantUser);
  const user = await userRepo.findOne({ where: { email } });
  if (!user) return null;

  const link = await linkRepo.findOne({ where: { tenant, userId: user.id } });

  if (!link) return null; // user exists but has no role in this tenant
  return { user, link };
}
// services/userService.ts

export async function listUsersForTenant(tenant: string) {
  const linkRepo = AppDataSource.getRepository(TenantUser);
  const links = await linkRepo.find({
    relations: ["user"],
    order: { user: { createdAt: "ASC" } },
  });
  return links
    .filter((l) => l.role !== Role.ADMIN)
    .map((l) => ({
      id: l.user.id,
      name: l.user.name,
      email: l.user.email,
      avatarUrl: l.user.avatarUrl || null,
      dateAdded: l.user.createdAt.toISOString(),
      role: l.role,
      tenant: l.tenant, // ← add this
    }));
}
export async function updateUserWithRole(
  userId: string,
  updates: {
    name?: string;
    email?: string;
    password?: string;
    role?: Role;
    domain?: string;
  },
  currentTenant: string
): Promise<{ user: User; link: TenantUser }> {
  const userRepo = AppDataSource.getRepository(User);
  const linkRepo = AppDataSource.getRepository(TenantUser);

  // 1) Find the User
  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  // 2) If email is changing, ensure uniqueness
  if (updates.email && updates.email !== user.email) {
    const exists = await userRepo.findOne({ where: { email: updates.email } });
    if (exists) throw new ApiError(400, "Email already in use");
    user.email = updates.email;
  }

  // 3) Update name/password
  if (updates.name) user.name = updates.name;
  if (updates.password) {
    user.password = await bcrypt.hash(updates.password, 10);
  }

  await userRepo.save(user);

  // 4) Find existing TenantUser link for this tenant
  const link = await linkRepo.findOne({
    where: { tenant: currentTenant, userId },
  });
  if (!link) throw new ApiError(400, "User is not a member of this tenant");

  // 5) If domain is changing (i.e. re-assigning to a different tenant) or role changes...
  if (updates.domain && updates.domain !== link.tenant) {
    // make sure the new tenant exists
    const tenant = await findTenantByDomain(updates.domain);
    if (!tenant)
      throw new ApiError(400, `Tenant “${updates.domain}” does not exist`);
    link.tenant = updates.domain;
  }
  if (updates.role && updates.role !== link.role) {
    link.role = updates.role;
  }

  await linkRepo.save(link);

  return { user, link };
}
// 2️⃣ Delete a user link (only from this tenant)
export async function deleteUserFromTenant(userId: string, tenant: string) {
  const linkRepo = AppDataSource.getRepository(TenantUser);
  await linkRepo.delete({ userId, tenant });
}
