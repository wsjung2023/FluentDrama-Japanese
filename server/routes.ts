import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { registerAuthUserRoutes } from "./routes/authUserRoutes";
import { registerUsageRoutes } from "./routes/usageRoutes";
import { registerSubscriptionRoutes } from "./routes/subscriptionRoutes";
import { registerAdminRoutes } from "./routes/adminRoutes";
import { registerSavedCharacterRoutes } from "./routes/savedCharacterRoutes";
import { registerAiCoreRoutes } from "./routes/aiCoreRoutes";
import { registerAiSupportRoutes } from "./routes/aiSupportRoutes";
import { registerAiImageRoutes } from "./routes/aiImageRoutes";
import { ensureJsonResponse } from "./routes/middleware/ensureJsonResponse";
import billingRouter from "./routes/billing";

type RouteRegistrar = (app: Express) => void;

const routeRegistrars: RouteRegistrar[] = [
  registerAuthUserRoutes,
  registerUsageRoutes,
  registerSubscriptionRoutes,
  registerAdminRoutes,
  registerAiImageRoutes,
  registerAiCoreRoutes,
  registerAiSupportRoutes,
  registerSavedCharacterRoutes,
];

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.use('/api/billing', billingRouter);

  app.use('/api', ensureJsonResponse);

  for (const registerRoute of routeRegistrars) {
    registerRoute(app);
  }

  const httpServer = createServer(app);
  return httpServer;
}
