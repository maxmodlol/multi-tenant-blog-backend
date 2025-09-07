// src/services/adHeaderService.ts
import { AppDataSource } from "../config/data-source";
import { AdHeaderSetting } from "../models/AdHeaderSetting";
// import { ApiError } from "../utils/ApiError";

export async function getAdHeaderSetting(): Promise<AdHeaderSetting | null> {
  const repo = AppDataSource.getRepository(AdHeaderSetting);
  return repo.findOne({ where: {} }); // returns the single row, or null
}

export async function upsertAdHeaderSetting(input: {
  headerSnippet: string;
  isEnabled?: boolean;
}): Promise<AdHeaderSetting> {
  const repo = AppDataSource.getRepository(AdHeaderSetting);
  const existing = await repo.findOne({ where: {} });

  if (existing) {
    existing.headerSnippet = input.headerSnippet;
    existing.isEnabled = input.isEnabled ?? existing.isEnabled;
    return repo.save(existing);
  } else {
    const newOne = repo.create({
      headerSnippet: input.headerSnippet,
      isEnabled: input.isEnabled ?? true,
    });
    return repo.save(newOne);
  }
}
