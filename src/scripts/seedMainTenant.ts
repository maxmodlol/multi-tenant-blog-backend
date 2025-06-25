// scripts/seedMainTenant.ts
import "dotenv/config";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { AppDataSource } from "../config/data-source";
import { Tenant } from "../models/Tenant";
import { TenantUser } from "../models/TenantUser";
import { User } from "../models/User";
import { Role } from "../types/Role";

async function run() {
  await AppDataSource.initialize();

  /* ── 1. Seed the “main” tenant ────────────────────────── */
  const tenantRepo = AppDataSource.getRepository(Tenant);

  let mainTenant = await tenantRepo.findOne({ where: { domain: "main" } });
  if (!mainTenant) {
    mainTenant = tenantRepo.create({
      id: randomUUID(), // explicit UUID so you know it
      domain: "main",
    });
    await tenantRepo.save(mainTenant);
    console.log("✅  Tenant  'main'  inserted");
  } else {
    console.log("✔  Tenant  'main'  already present");
  }

  /* ── 2. Seed a root admin (optional) ──────────────────── */
  const email = "root@example.com";
  const userRepo = AppDataSource.getRepository(User);
  const linkRepo = AppDataSource.getRepository(TenantUser);

  let admin = await userRepo.findOne({ where: { email } });
  if (!admin) {
    admin = userRepo.create({
      name: "Root",
      email,
      password: await bcrypt.hash("rootPass123", 10),
    });
    await userRepo.save(admin);
    console.log("✅  User   root@example.com inserted");
  } else {
    console.log("✔  User   root@example.com already present");
  }

  const linkExists = await linkRepo.findOne({
    where: { tenant: "main", user: { id: admin.id } },
    relations: ["user"],
  });
  if (!linkExists) {
    const link = linkRepo.create({
      tenant: "main",
      role: Role.ADMIN, // or Role.SUPER_ADMIN if that exists
      user: admin,
    });
    await linkRepo.save(link);
    console.log("✅  TenantUser link created (main ⇢ root)");
  } else {
    console.log("✔  TenantUser link already present");
  }

  await AppDataSource.destroy();
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌  Seeding failed", err);
    process.exit(1);
  });
