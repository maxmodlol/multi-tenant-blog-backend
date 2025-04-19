// src/utils/fetchAuthors.ts
import { In } from "typeorm";
import { AppDataSource } from "../config/data-source"; // <-- public DS
import { User } from "../models/User";

/**
 * Fetch a single author’s public profile.
 */
export async function fetchAuthor(authorId: string) {
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOneBy({ id: authorId });
  return { id: authorId, name: user?.name ?? "مؤلف مجهول" };
}

/**
 * Fetch many authors in one query and return a { id -> name } map.
 */
export async function fetchAuthorsMap(authorIds: string[]) {
  if (authorIds.length === 0) return {};
  const repo = AppDataSource.getRepository(User);
  const users = await repo.find({ where: { id: In(authorIds) } });

  return Object.fromEntries(
    users.map((u) => [u.id, u.name]) // { "uuid" : "Ahmed" }
  );
}
