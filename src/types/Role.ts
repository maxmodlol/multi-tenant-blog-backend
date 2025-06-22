// src/types/Role.ts ---------------------------------------------------------
export enum Role {
  ADMIN = "ADMIN", // main‑tenant super‑user
  PUBLISHER = "PUBLISHER", // owner of a sub‑tenant
  EDITOR = "EDITOR", // content helper inside tenant
  ADMIN_HELPER = "ADMIN_HELPER", // new: main-tenant assistant (limited)
}
