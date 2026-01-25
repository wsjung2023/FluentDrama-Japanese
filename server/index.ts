import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync, isStripeConfigured } from './services/stripeClient';

const app = express();

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('[Stripe] DATABASE_URL not set, skipping Stripe initialization');
    return;
  }

  try {
    const configured = await isStripeConfigured();
    if (!configured) {
      console.log('[Stripe] Stripe not configured, skipping initialization');
      return;
    }

    console.log('[Stripe] Initializing schema...');
    await runMigrations({ databaseUrl });
    console.log('[Stripe] Schema ready');

    const stripeSync = await getStripeSync();

    const replitDomains = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN;
    if (replitDomains) {
      console.log('[Stripe] Setting up managed webhook...');
      const webhookBaseUrl = `https://${replitDomains.split(',')[0]}`;
      try {
        const { webhook } = await stripeSync.findOrCreateManagedWebhook(
          `${webhookBaseUrl}/api/stripe/webhook`
        );
        console.log(`[Stripe] Webhook configured: ${webhook.url}`);
      } catch (webhookError) {
        console.log('[Stripe] Webhook setup skipped (will retry on next deploy):', webhookError);
      }
    } else {
      console.log('[Stripe] No domain found, skipping webhook setup');
    }

    console.log('[Stripe] Syncing data in background...');
    stripeSync.syncBackfill()
      .then(() => console.log('[Stripe] Data sync complete'))
      .catch((err: any) => console.error('[Stripe] Sync error:', err));
  } catch (error) {
    console.error('[Stripe] Init failed:', error);
  }
}

// Add CORS and security headers
app.use((req, res, next) => {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie');
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  // 보안 헤더
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// Stripe Webhook - MUST be registered BEFORE express.json() 
// to receive raw body for signature verification
import { WebhookHandlers } from './services/webhookHandlers';
app.post('/api/stripe/webhook', 
  express.raw({ type: 'application/json' }), 
  async (req: any, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('[Stripe Webhook] Error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize Stripe before routes
  await initStripe();
  
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Ensure we always send JSON for API routes
    if (req.path.startsWith('/api')) {
      res.setHeader('Content-Type', 'application/json');
      if (!res.headersSent) {
        res.status(status).json({ message, error: true });
      }
    } else {
      res.status(status).json({ message });
    }
    
    console.error(`Server error on ${req.method} ${req.path}:`, err);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
