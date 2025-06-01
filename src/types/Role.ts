// src/types/Role.ts ---------------------------------------------------------
export enum Role {
  ADMIN = "ADMIN", // main‑tenant super‑user
  PUBLISHER = "PUBLISHER", // owner of a sub‑tenant
  EDITOR = "EDITOR", // helper inside main or tenant
  // SUPER_ADMIN = "SUPER_ADMIN",  // optional root fallback
}
