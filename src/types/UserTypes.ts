// src/types/UserTypes.ts
export enum Role {
    SUPER_ADMIN = "SUPER_ADMIN",
    ADMIN = "ADMIN",
    PUBLISHER = "PUBLISHER",
  }
  
  export interface CreateUserInput {
    name: string;
    email: string;
    password: string;
    role: Role;
  }
  
  export interface UpdateUserInput {
    name?: string;
    email?: string;
    password?: string;
    role?: Role;
  }
  