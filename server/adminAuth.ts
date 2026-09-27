import { createHash, timingSafeEqual } from "crypto";
import type { Request, Response, NextFunction } from "express";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

// Guards /api/admin/* with a shared password sent as `Authorization: Bearer <password>`.
// Fails closed: if ADMIN_PASSWORD isn't configured, admin routes are unavailable.
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return res.status(503).json({ message: "Admin access is not configured" });
  }

  const header = req.headers.authorization ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";

  // Compare fixed-length digests so the check doesn't leak the password length or prefix.
  if (!provided || !timingSafeEqual(digest(provided), digest(expected))) {
    return res.status(401).json({ message: "Invalid admin password" });
  }

  next();
}
