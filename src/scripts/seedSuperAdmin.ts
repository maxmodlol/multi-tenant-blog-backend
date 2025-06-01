// scripts/seedSuperAdmin.ts
import "dotenv/config";
import bcrypt from "bcrypt";
import { AppDataSource } from "../config/data-source";
import { User } from "../models/User";
import { TenantUser } from "../models/TenantUser";
import { Role } from "../types/Role"; // ← wherever your enum really lives

(async () => {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  const linkRepo = AppDataSource.getRepository(TenantUser);

  // 1) Already seeded?
  const existing = await userRepo.findOne({
    where: { email: "root@example.com" },
  });
  if (existing) {
    console.log("✔ super-admin already exists");
    process.exit(0);
  }

  // 2) Create the base User record
  const user = userRepo.create({
    name: "Root",
    email: "root@example.com",
    password: "rootPass123",
  });
  await userRepo.save(user);

  // 3) Create the TenantUser link in the "main" tenant with SUPER_ADMIN role
  const link = linkRepo.create({
    tenant: "main",
    role: Role.ADMIN,
    user: user, // or: userId: user.id
  });
  await linkRepo.save(link);

  console.log("✅ seeded super-admin (and tenant link)");
  process.exit(0);
})();
