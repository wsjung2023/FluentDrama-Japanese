import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import MemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.log("Invalid stored password format");
      return false;
    }
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    const result = timingSafeEqual(hashedBuf, suppliedBuf);
    console.log("Password comparison result:", result);
    return result;
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const Store = MemoryStore(session);
  const sessionStore = new Store({
    checkPeriod: 86400000, // prune expired entries every 24h
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: false, // set to true in production with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      sameSite: 'lax' // CORS와 SameSite 설정
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          console.log("Attempting login for:", email);
          const user = await storage.getUserByEmail(email);
          
          if (!user) {
            console.log("User not found:", email);
            return done(null, false);
          }
          
          console.log("User found, checking password...");
          
          // Use proper password comparison
          if (!user.password || !(await comparePasswords(password, user.password))) {
            console.log("Password mismatch - login failed");
            return done(null, false);
          } else {
            console.log("Password match - login successful");
            return done(null, user);
          }
        } catch (error) {
          console.error("LocalStrategy error:", error);
          return done(error);
        }
      }
    )
  );

  // Google OAuth Strategy - only setup if credentials are available
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || 
            `https://fluent-drama-japanese.replit.app/api/google/callback`,
          proxy: true, // Trust proxy headers for correct redirect URLs
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error("No email found in Google profile"));
            }

            let user = await storage.getUserByEmail(email);
            if (!user) {
              // Create new user with admin rights for mainstop3@gmail.com
              const isAdmin = email === "mainstop3@gmail.com";
              user = await storage.createUser({
                email,
                firstName: profile.name?.givenName || "",
                lastName: profile.name?.familyName || "",
                profileImageUrl: profile.photos?.[0]?.value,
                subscriptionTier: 'free',
                subscriptionStatus: 'active',
                isAdmin: isAdmin
              });
            }
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Google OAuth routes - only setup if credentials are available
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get("/api/google", (req, res, next) => {
      // 📊 현재 요청 정보 로깅
      const proto = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const currentURL = `${proto}://${host}`;
      
      console.log(`🔗 Google OAuth 시작`);
      console.log(`📍 현재 도메인: ${currentURL}`);
      console.log(`📍 Headers - Proto: ${req.headers['x-forwarded-proto']}, Host: ${req.headers['x-forwarded-host']}`);
      console.log(`📍 Request - Protocol: ${req.protocol}, Host: ${req.get('host')}`);
      console.log(`🎯 설정된 콜백 URL: ${process.env.GOOGLE_CALLBACK_URL || 'https://fluent-drama-japanese.replit.app/api/google/callback'}`);
      
      passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
    });

    app.get("/api/google/callback",
      passport.authenticate("google", { failureRedirect: "/" }),
      (req, res) => {
        console.log("✅ Google OAuth 콜백 성공 - 홈으로 리다이렉트");
        res.redirect("/");
      }
    );
  } else {
    // Fallback routes when Google OAuth is not configured
    app.get("/api/google", (req, res) => {
      res.status(503).json({ message: "Google OAuth not configured" });
    });

    app.get("/api/google/callback", (req, res) => {
      res.status(503).json({ message: "Google OAuth not configured" });
    });
  }
}

// Authentication middleware
export function isAuthenticated(req: any, res: any, next: any) {
  if ((req.session as any)?.userId || req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Admin authentication middleware
export function isAdmin(req: any, res: any, next: any) {
  if (req.isAuthenticated() && req.user?.isAdmin === true) {
    return next();
  }
  res.status(403).json({ message: "Admin access required" });
}