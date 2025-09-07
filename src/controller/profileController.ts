import { RequestHandler } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../models/User";
import * as bcrypt from "bcrypt";

export const getMeProfile: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }
    const repo = AppDataSource.getRepository(User);
    const me = await repo.findOne({ where: { id: req.user.sub } });
    if (!me) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: me.id,
      name: me.name,
      email: me.email,
      avatarUrl: me.avatarUrl || null,
      bio: me.bio || null,
    });
  } catch (err) {
    next(err);
  }
};

export const updateMeProfile: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }
    const repo = AppDataSource.getRepository(User);
    const me = await repo.findOne({ where: { id: req.user.sub } });
    if (!me) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const { name, bio, avatarUrl } = req.body ?? {};
    if (name) me.name = name;
    if (avatarUrl) me.avatarUrl = avatarUrl;
    if (typeof bio === "string") me.bio = bio;
    await repo.save(me);
    res.json({
      id: me.id,
      name: me.name,
      email: me.email,
      avatarUrl: me.avatarUrl || null,
      bio: me.bio || null,
    });
  } catch (err) {
    next(err);
  }
};

export const changeMyPassword: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }
    const { oldPassword, newPassword } = req.body ?? {};
    if (!oldPassword || !newPassword) {
      res
        .status(400)
        .json({ error: "oldPassword and newPassword are required" });
      return;
    }
    const repo = AppDataSource.getRepository(User);
    const me = await repo.findOne({ where: { id: req.user.sub } });
    if (!me) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const ok = await bcrypt.compare(oldPassword, me.password);
    if (!ok) {
      res.status(400).json({ error: "Incorrect current password" });
      return;
    }
    me.password = newPassword; // hashed by entity hooks
    await repo.save(me);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
