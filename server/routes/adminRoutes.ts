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

const adminMasterConfigParamsSchema = z.object({
  key: z.string().trim().min(1),
});

const adminMasterConfigBodySchema = z.object({
  configValue: z.record(z.unknown()),
  isActive: z.boolean().optional(),
});

const adminCodeStandardBodySchema = z.object({
  standardKey: z.string().trim().min(1),
  category: z.string().trim().min(1),
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  severity: z.enum(['required', 'recommended', 'advisory']).optional(),
  isActive: z.boolean().optional(),
});

const adminCodeStandardQuerySchema = z.object({
  category: z.string().trim().min(1).optional(),
});


const adminPromptTemplateBodySchema = z.object({
  templateKey: z.enum(['conversation_system', 'conversation_initial_prompt']),
  scenarioId: z.string().trim().min(1).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  content: z.string().trim().min(1),
  version: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  updatedBy: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
});

const adminPromptTemplateQuerySchema = z.object({
  templateKey: z.enum(['conversation_system', 'conversation_initial_prompt']).optional(),
});


const adminPromptTemplateDeactivateBodySchema = z.object({
  templateKey: z.enum(['conversation_system', 'conversation_initial_prompt']),
  scenarioId: z.string().trim().min(1).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

const adminCodeStandardDeactivateBodySchema = z.object({
  standardKey: z.string().trim().min(1),
  category: z.string().trim().min(1),
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

  app.get("/api/admin/master-config/:key", isAdmin, async (req, res) => {
    try {
      const { key } = parseOrThrow(adminMasterConfigParamsSchema, req.params);
      const config = await storage.getMasterConfig(key);
      if (!config) {
        return res.status(404).json({ message: "Master config not found" });
      }
      res.json(config);
    } catch (error) {
      logError("Get master config error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to fetch master config");
      res.status(status).json({ message });
    }
  });

  app.put("/api/admin/master-config/:key", isAdmin, async (req, res) => {
    try {
      const { key } = parseOrThrow(adminMasterConfigParamsSchema, req.params);
      const payload = parseOrThrow(adminMasterConfigBodySchema, req.body);
      const config = await storage.upsertMasterConfig({
        configKey: key,
        configValue: payload.configValue,
        isActive: payload.isActive,
      });
      res.json(config);
    } catch (error) {
      logError("Upsert master config error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to upsert master config");
      res.status(status).json({ message });
    }
  });





  app.post("/api/admin/master-config/:key", isAdmin, async (req, res) => {
    try {
      const { key } = parseOrThrow(adminMasterConfigParamsSchema, req.params);
      const payload = parseOrThrow(adminMasterConfigBodySchema, req.body);
      const config = await storage.upsertMasterConfig({
        configKey: key,
        configValue: payload.configValue,
        isActive: payload.isActive,
      });
      res.json(config);
    } catch (error) {
      logError("Create master config error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to create master config");
      res.status(status).json({ message });
    }
  });

  app.patch("/api/admin/master-config/:key", isAdmin, async (req, res) => {
    try {
      const { key } = parseOrThrow(adminMasterConfigParamsSchema, req.params);
      const payload = parseOrThrow(adminMasterConfigBodySchema, req.body);
      const config = await storage.upsertMasterConfig({
        configKey: key,
        configValue: payload.configValue,
        isActive: payload.isActive,
      });
      res.json(config);
    } catch (error) {
      logError("Patch master config error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to patch master config");
      res.status(status).json({ message });
    }
  });

  app.delete("/api/admin/master-config/:key", isAdmin, async (req, res) => {
    try {
      const { key } = parseOrThrow(adminMasterConfigParamsSchema, req.params);
      const ok = await storage.deactivateMasterConfig(key);
      if (!ok) {
        return res.status(404).json({ message: "Master config not found" });
      }
      res.json({ message: "Master config deactivated", key });
    } catch (error) {
      logError("Deactivate master config error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to deactivate master config");
      res.status(status).json({ message });
    }
  });

  app.get("/api/admin/code-standards", isAdmin, async (req, res) => {
    try {
      const { category } = parseOrThrow(adminCodeStandardQuerySchema, req.query);
      const standards = await storage.getCodeStandards(category);
      res.json({ items: standards, count: standards.length });
    } catch (error) {
      logError("Get code standards error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to fetch code standards");
      res.status(status).json({ message });
    }
  });

  app.put("/api/admin/code-standards", isAdmin, async (req, res) => {
    try {
      const payload = parseOrThrow(adminCodeStandardBodySchema, req.body);
      const standard = await storage.upsertCodeStandard(payload);
      res.json(standard);
    } catch (error) {
      logError("Upsert code standard error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to upsert code standard");
      res.status(status).json({ message });
    }
  });






  app.post("/api/admin/code-standards", isAdmin, async (req, res) => {
    try {
      const payload = parseOrThrow(adminCodeStandardBodySchema, req.body);
      const standard = await storage.upsertCodeStandard(payload);
      res.json(standard);
    } catch (error) {
      logError("Create code standard error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to create code standard");
      res.status(status).json({ message });
    }
  });

  app.patch("/api/admin/code-standards", isAdmin, async (req, res) => {
    try {
      const payload = parseOrThrow(adminCodeStandardBodySchema, req.body);
      const standard = await storage.upsertCodeStandard(payload);
      res.json(standard);
    } catch (error) {
      logError("Patch code standard error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to patch code standard");
      res.status(status).json({ message });
    }
  });

  app.delete("/api/admin/code-standards", isAdmin, async (req, res) => {
    try {
      const payload = parseOrThrow(adminCodeStandardDeactivateBodySchema, req.body);
      const ok = await storage.deactivateCodeStandard(payload.standardKey, payload.category);
      if (!ok) {
        return res.status(404).json({ message: "Code standard not found" });
      }
      res.json({ message: "Code standard deactivated", standardKey: payload.standardKey, category: payload.category });
    } catch (error) {
      logError("Deactivate code standard error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to deactivate code standard");
      res.status(status).json({ message });
    }
  });

  app.get("/api/admin/prompt-templates", isAdmin, async (req, res) => {
    try {
      const { templateKey } = parseOrThrow(adminPromptTemplateQuerySchema, req.query);
      const items = await storage.getPromptTemplates(templateKey);
      res.json({ items, count: items.length });
    } catch (error) {
      logError("Get prompt templates error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to fetch prompt templates");
      res.status(status).json({ message });
    }
  });


  app.get("/api/admin/prompt-templates/summary", isAdmin, async (_req, res) => {
    try {
      const items = await storage.getPromptTemplates();
      const summaryByKey = new Map<string, {
        templateKey: string;
        version: string;
        description?: string;
        updatedBy?: string;
      }>();

      for (const item of items) {
        if (!summaryByKey.has(item.templateKey)) {
          summaryByKey.set(item.templateKey, {
            templateKey: item.templateKey,
            version: item.version,
            description: item.description,
            updatedBy: item.updatedBy,
          });
        }
      }

      const latestTemplates = Array.from(summaryByKey.values());
      res.json({ latestTemplates, count: latestTemplates.length });
    } catch (error) {
      logError("Get prompt template summary error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to fetch prompt template summary");
      res.status(status).json({ message });
    }
  });

  app.put("/api/admin/prompt-templates", isAdmin, async (req, res) => {
    try {
      const payload = parseOrThrow(adminPromptTemplateBodySchema, req.body);
      const item = await storage.upsertPromptTemplate(payload);
      res.json(item);
    } catch (error) {
      logError("Upsert prompt template error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to upsert prompt template");
      res.status(status).json({ message });
    }
  });




  app.post("/api/admin/prompt-templates", isAdmin, async (req, res) => {
    try {
      const payload = parseOrThrow(adminPromptTemplateBodySchema, req.body);
      const item = await storage.upsertPromptTemplate(payload);
      res.json(item);
    } catch (error) {
      logError("Create prompt template error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to create prompt template");
      res.status(status).json({ message });
    }
  });

  app.patch("/api/admin/prompt-templates", isAdmin, async (req, res) => {
    try {
      const payload = parseOrThrow(adminPromptTemplateBodySchema, req.body);
      const item = await storage.upsertPromptTemplate(payload);
      res.json(item);
    } catch (error) {
      logError("Patch prompt template error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to patch prompt template");
      res.status(status).json({ message });
    }
  });

  app.delete("/api/admin/prompt-templates", isAdmin, async (req, res) => {
    try {
      const payload = parseOrThrow(adminPromptTemplateDeactivateBodySchema, req.body);
      const ok = await storage.deactivatePromptTemplate(payload.templateKey, payload.scenarioId, payload.difficulty);
      if (!ok) {
        return res.status(404).json({ message: "Prompt template not found" });
      }
      res.json({ message: "Prompt template deactivated", ...payload });
    } catch (error) {
      logError("Deactivate prompt template error", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to deactivate prompt template");
      res.status(status).json({ message });
    }
  });

}
