import { clerkClient, clerkMiddleware, getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage.js";
import type { Nonprofit } from "../shared/schema.js";

// The Vercel Marketplace integration provisions the publishable key under its Next.js name.
export const authMiddleware = () =>
  clerkMiddleware({
    publishableKey:
      process.env.CLERK_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  });

export function getUserId(req: Request): string | null {
  return getAuth(req).userId ?? null;
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!getUserId(req)) {
    return res.status(401).json({ message: "Sign in required" });
  }
  next();
}

const ADMIN_CACHE_MS = 5 * 60 * 1000;
const adminCache = new Map<string, { isAdmin: boolean; expires: number }>();

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

// A user is an admin if any of their *verified* Clerk emails is listed in ADMIN_EMAILS.
export async function isAdmin(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const allowed = adminEmails();
  if (allowed.size === 0) return false;

  const cached = adminCache.get(userId);
  if (cached && cached.expires > Date.now()) return cached.isAdmin;

  const user = await clerkClient.users.getUser(userId);
  const result = user.emailAddresses.some(
    (e) =>
      e.verification?.status === "verified" &&
      allowed.has(e.emailAddress.toLowerCase()),
  );
  adminCache.set(userId, { isAdmin: result, expires: Date.now() + ADMIN_CACHE_MS });
  return result;
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Sign in required" });
  }
  try {
    if (!(await isAdmin(userId))) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (error) {
    next(error);
  }
}

// Loads the nonprofit and checks the signed-in user owns it (admins may act on any).
// Sends the error response itself and returns null when access is denied.
export async function loadManagedNonprofit(
  req: Request,
  res: Response,
  nonprofitId: string,
): Promise<Nonprofit | null> {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ message: "Sign in required" });
    return null;
  }

  const nonprofit = await storage.getNonprofitById(nonprofitId);
  if (!nonprofit) {
    res.status(404).json({ message: "Nonprofit not found" });
    return null;
  }

  if (nonprofit.ownerUserId !== userId && !(await isAdmin(userId))) {
    res.status(403).json({ message: "You don't manage this nonprofit" });
    return null;
  }

  return nonprofit;
}
