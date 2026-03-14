// Authentication and current-user API routes.
import type { Express } from "express";
import passport from "passport";
import { z } from "zod";
import { storage } from "../storage";
import { hashPassword, isAuthenticated } from "../auth";
import { ApiError, getErrorMessage, getErrorStatus } from "../lib/apiError";
import { parseOrThrow } from "../lib/validate";
import { logError } from "../lib/logger";

function sanitizeUser(user: Record<string, any>) {
  const plain = JSON.parse(JSON.stringify(user));
  delete plain.password;
  return plain;
}

export function registerAuthUserRoutes(app: Express) {
  app.post("/api/register", async (req, res, next) => {
    try {
      const registerSchema = z.object({
        email: z.string().trim().email("유효한 이메일을 입력하세요").transform((value) => value.toLowerCase()),
        password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
        firstName: z.string().trim().min(1).max(100).optional(),
        lastName: z.string().trim().min(1).max(100).optional(),
      });
      const { email, password, firstName, lastName } = parseOrThrow(registerSchema, req.body);

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        throw new ApiError(400, "사용자가 이미 존재합니다");
      }

      const hashedPassword = await hashPassword(password);

      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
      });

      req.login(user, (err: any) => {
        if (err) return next(err);
        res.status(201).json(sanitizeUser(user));
      });
    } catch (error) {
      logError("Registration error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "등록 실패");
      res.status(status).json({ message });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(sanitizeUser(req.user as Record<string, any>));
  });

  app.get("/api/logout", (req, res) => {
    (req.session as any).userId = null;
    req.logout((err: any) => {
      if (err) {
        logError("Logout error", err);
      }
      res.redirect("/");
    });
  });

  app.post("/api/logout", (req, res) => {
    (req.session as any).userId = null;
    req.logout((err: any) => {
      if (err) {
        logError("Logout error", err);
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.session as any)?.userId || req.user?.id;
      if (!userId) {
        throw new ApiError(401, "Unauthorized");
      }

      const user = await storage.getUser(userId);
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      res.json(sanitizeUser(user));
    } catch (error) {
      logError("Get user error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to fetch user");
      res.status(status).json({ message });
    }
  });
}
