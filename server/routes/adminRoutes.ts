// Admin-only API routes for user lookup and subscription/usage management.
import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAdmin } from "../auth";
import { logError } from "../lib/logger";
import { getErrorMessage, getErrorStatus } from "../lib/apiError";
import { parseOrThrow } from "../lib/validate";

const adminUserEmailParamsSchema = z.object({
  email: z.string().trim().email(),
});

const adminUserIdParamsSchema = z.object({
  id: z.string().min(1),
});

const adminSubscriptionBodySchema = z.object({
  tier: z.enum(['free', 'starter', 'pro', 'premium']),
});

export function registerAdminRoutes(app: Express) {
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      logError("Get users error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to fetch users");
      res.status(status).json({ message });
    }
  });

  app.get("/api/admin/user/:email", isAdmin, async (req, res) => {
    try {
      const { email } = parseOrThrow(adminUserEmailParamsSchema, req.params);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      logError("Get user error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to fetch user");
      res.status(status).json({ message });
    }
  });

  app.put("/api/admin/user/:id/subscription", isAdmin, async (req, res) => {
    try {
      const { id } = parseOrThrow(adminUserIdParamsSchema, req.params);
      const { tier } = parseOrThrow(adminSubscriptionBodySchema, req.body);

      const user = await storage.updateUserSubscription(id, {
        subscriptionTier: tier,
        subscriptionStatus: tier === 'free' ? 'inactive' : 'active',
        paymentProvider: tier === 'free' ? null : 'admin',
        customerId: tier === 'free' ? null : `admin_${id}`,
        subscriptionId: tier === 'free' ? null : `admin_sub_${Date.now()}`,
        subscriptionExpiresAt: tier === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      res.json(user);
    } catch (error) {
      logError("Update subscription error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to update subscription");
      res.status(status).json({ message });
    }
  });

  app.put("/api/admin/user/:id/reset-usage", isAdmin, async (req, res) => {
    try {
      const { id } = parseOrThrow(adminUserIdParamsSchema, req.params);
      const user = await storage.resetUserUsage(id);
      res.json(user);
    } catch (error) {
      logError("Reset usage error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to reset usage");
      res.status(status).json({ message });
    }
  });
}
