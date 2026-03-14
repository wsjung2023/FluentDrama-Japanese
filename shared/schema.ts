import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean, integer, date, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  }
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // for email/password login
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Subscription fields
  subscriptionTier: varchar("subscription_tier").default("free"), // free, starter, pro, premium
  subscriptionStatus: varchar("subscription_status").default("active"), // active, canceled, expired
  paymentProvider: varchar("payment_provider"), // portone, toss, paddle, stripe
  customerId: varchar("customer_id"),
  subscriptionId: varchar("subscription_id"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  // Stripe specific fields
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  // Usage tracking
  conversationCount: varchar("conversation_count").default("0"), // Monthly conversation usage
  imageGenerationCount: varchar("image_generation_count").default("0"), // Track image generation
  ttsUsageCount: varchar("tts_usage_count").default("0"), // Track TTS usage
  // Keep old fields for compatibility during migration
  dailyUsageCount: varchar("daily_usage_count").default("0"),
  monthlyImageCount: varchar("monthly_image_count").default("0"),
  lastUsageReset: timestamp("last_usage_reset").defaultNow(),
  // Admin role
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Learning sessions table
export const learningSessions = pgTable("learning_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  audience: text("audience").notNull(), // 'student', 'general', 'business'
  character: jsonb("character").$type<{
    name: string;
    gender: 'male' | 'female';
    style: 'cheerful' | 'calm' | 'strict';
    imageUrl?: string;
  }>().notNull(),
  scenario: jsonb("scenario").$type<{
    presetKey?: string;
    freeText?: string;
  }>().notNull(),
  dialogue: text("dialogue").array().default([]),
  audioUrls: text("audio_urls").array().default([]),
  focusPhrases: text("focus_phrases").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});


// Conversation sessions table (Plan 02 Sprint 2: persistent session storage)
export const conversationSessions = pgTable("conversation_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  scenarioId: varchar("scenario_id").notNull(),
  difficulty: varchar("difficulty").notNull(),
  characterId: varchar("character_id").notNull(),
  userGoal: text("user_goal").notNull(),
  history: jsonb("history").$type<Array<{
    speaker: 'user' | 'assistant' | 'character';
    text: string;
    timestamp: number;
  }>>().default([]),
  lastFeedback: jsonb("last_feedback").$type<{
    accuracy: number;
    suggestions: string[];
    pronunciation: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


// Conversation messages table (Plan 02 Sprint 2: turn-level persistence)
export const conversationMessages = pgTable("conversation_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => conversationSessions.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  speaker: varchar("speaker").notNull(), // user | assistant | character
  text: text("text").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});



// Prompt templates table (Plan 02 Sprint 2: prompt governance + DB masterization)
export const promptTemplates = pgTable("prompt_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateKey: varchar("template_key").notNull(),
  scenarioId: varchar("scenario_id"),
  difficulty: varchar("difficulty"),
  content: text("content").notNull(),
  version: varchar("version").default("v1"),
  description: text("description"),
  updatedBy: varchar("updated_by"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



// Master config table (Plan 02 Sprint 2: runtime master flags / policy SSOT)
export const masterConfigs = pgTable("master_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  configKey: varchar("config_key").notNull().unique(),
  configValue: jsonb("config_value").$type<Record<string, unknown>>().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Code standards table (Plan 02 Sprint 2: coding rules / guardrails SSOT)
export const codeStandards = pgTable("code_standards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  standardKey: varchar("standard_key").notNull(),
  category: varchar("category").notNull(), // e.g. backend|frontend|docs|ops
  title: varchar("title").notNull(),
  body: text("body").notNull(),
  severity: varchar("severity").default("recommended"), // required|recommended|advisory
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Saved characters table for character reuse
export const savedCharacters = pgTable("saved_characters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  gender: varchar("gender").notNull(), // 'male' | 'female'
  style: varchar("style").notNull(), // 'cheerful' | 'calm' | 'strict'
  imageUrl: text("image_url").notNull(),
  // Character's appearance details for consistency
  audience: varchar("audience").notNull(), // 'student' | 'general' | 'business'
  scenario: text("scenario"), // Original scenario used for generation
  backgroundPrompt: text("background_prompt"), // AI-generated background prompt
  isPublic: boolean("is_public").default(false), // For future sharing feature
  usageCount: varchar("usage_count").default("0"), // Track how often used
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSessionSchema = createInsertSchema(learningSessions).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSessionSchema = createInsertSchema(conversationSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSavedCharacterSchema = createInsertSchema(savedCharacters).omit({
  id: true,
  createdAt: true,
  usageCount: true,
  lastUsedAt: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const characterSchema = z.object({
  name: z.string().min(1, "Character name is required"),
  gender: z.enum(['male', 'female']),
  style: z.enum(['cheerful', 'calm', 'strict']),
  imageUrl: z.string().optional(),
});

export const scenarioSchema = z.object({
  presetKey: z.string().optional(),
  freeText: z.string().optional(),
}).refine(data => data.presetKey || data.freeText, {
  message: "Either preset or custom scenario is required"
});

export const generateImageRequestSchema = z.object({
  name: z.string(),
  gender: z.enum(['male', 'female']),
  style: z.enum(['cheerful', 'calm', 'strict']),
  audience: z.enum(['student', 'general', 'business']),
  scenario: z.string().optional(),
});

export const generateDialogueRequestSchema = z.object({
  audience: z.enum(['student', 'general', 'business']),
  character: characterSchema,
  scenario: scenarioSchema,
});

export const ttsRequestSchema = z.object({
  text: z.string().min(1),
  voiceId: z.string().min(1).optional(),
  character: z.object({
    style: z.string().optional(),
    gender: z.string().optional(),
    role: z.string().optional(),
  }).optional(),
  emotion: z.enum(['neutral', 'happy', 'concerned', 'professional', 'excited', 'calm', 'friendly']).optional(),
});

export const speechRecognitionRequestSchema = z.object({
  audioBlob: z.string(), // base64 encoded audio
  language: z.enum(['en', 'ko', 'ja']).default('en'),
});


export const conversationDifficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);

export const conversationStartRequestSchema = z.object({
  scenarioId: z.string().trim().min(1),
  difficulty: conversationDifficultySchema,
  characterId: z.string().trim().min(1),
  userGoal: z.string().trim().min(1),
});

export const conversationHistoryItemSchema = z.object({
  speaker: z.enum(['user', 'assistant', 'character']),
  text: z.string().trim().min(1),
});

export const conversationTurnRequestSchema = z.object({
  sessionId: z.string().trim().min(1),
  userInput: z.string().trim().min(1),
  history: z.array(conversationHistoryItemSchema).default([]),
  audioMeta: z.object({
    sttConfidence: z.number().min(0).max(1).optional(),
    durationMs: z.number().int().positive().optional(),
  }).optional(),
});

export const conversationResumeRequestSchema = z.object({
  sessionId: z.string().trim().min(1),
});

export const conversationTurnSchema = z.object({
  speaker: z.enum(['user', 'assistant', 'character']),
  text: z.string(),
  audioUrl: z.string().optional(),
  timestamp: z.number(),
  feedback: z.object({
    accuracy: z.number().min(0).max(100).optional(),
    suggestions: z.array(z.string()).optional(),
    pronunciation: z.string().optional(),
  }).optional(),
});

export const conversationStateSchema = z.object({
  turns: z.array(conversationTurnSchema),
  currentTopic: z.string(),
  level: conversationDifficultySchema,
  isListening: z.boolean(),
  isWaitingForResponse: z.boolean(),
});

// ============================================
// BILLING & SUBSCRIPTION TABLES (Stripe Integration)
// ============================================

// Billing plans - stored in DB for dynamic management
export const billingPlans = pgTable("billing_plans", {
  id: varchar("id").primaryKey(),
  app: varchar("app").notNull().default("fluentdrama"),
  name: varchar("name").notNull(),
  priceMonthlyKrw: integer("price_monthly_krw").notNull().default(0),
  priceMonthlyUsd: varchar("price_monthly_usd"),
  stripePriceId: varchar("stripe_price_id"),
  stripeProductId: varchar("stripe_product_id"),
  features: jsonb("features").$type<{
    conversation_limit_month: number;
    image_limit_month: number;
    tts_limit_month: number;
    model_tier: "basic" | "premium";
  }>().notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// User subscriptions - tracks active subscriptions
export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  app: varchar("app").notNull().default("fluentdrama"),
  planId: varchar("plan_id").notNull(),
  status: varchar("status").notNull().default("active"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  stripeCustomerId: varchar("stripe_customer_id"),
  paymentMethod: varchar("payment_method"),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Payment transactions - tracks all payments
export const paymentTransactions = pgTable("payment_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionId: varchar("subscription_id").notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  stripeInvoiceId: varchar("stripe_invoice_id"),
  amount: integer("amount").notNull(),
  currency: varchar("currency").notNull().default("KRW"),
  status: varchar("status").notNull(),
  paymentMethod: varchar("payment_method"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Refund requests - tracks refund requests
export const refundRequests = pgTable("refund_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionId: varchar("subscription_id").notNull(),
  userId: varchar("user_id").notNull(),
  reason: text("reason").notNull(),
  refundAmount: integer("refund_amount"),
  status: varchar("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// User usage tracking - more granular than users table
export const userUsage = pgTable("user_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  usageKey: varchar("usage_key").notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  usedInPeriod: integer("used_in_period").notNull().default(0),
  limitInPeriod: integer("limit_in_period").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});


// ============================================
// INSERT SCHEMAS & TYPES
// ============================================

export const insertBillingPlanSchema = createInsertSchema(billingPlans).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertRefundRequestSchema = createInsertSchema(refundRequests).omit({
  id: true,
  createdAt: true,
});

export const insertUserUsageSchema = createInsertSchema(userUsage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationMessageSchema = createInsertSchema(conversationMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertConversationSession = z.infer<typeof insertConversationSessionSchema>;
export type ConversationSessionRecord = typeof conversationSessions.$inferSelect;
export type ConversationMessageRecord = typeof conversationMessages.$inferSelect;
export type PromptTemplateRecord = typeof promptTemplates.$inferSelect;
export type MasterConfigRecord = typeof masterConfigs.$inferSelect;
export type CodeStandardRecord = typeof codeStandards.$inferSelect;
export type InsertSavedCharacter = z.infer<typeof insertSavedCharacterSchema>;
export type LearningSession = typeof learningSessions.$inferSelect;
export type SavedCharacter = typeof savedCharacters.$inferSelect;
export type Character = z.infer<typeof characterSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
export type GenerateImageRequest = z.infer<typeof generateImageRequestSchema>;
export type GenerateDialogueRequest = z.infer<typeof generateDialogueRequestSchema>;
export type TTSRequest = z.infer<typeof ttsRequestSchema>;
export type SpeechRecognitionRequest = z.infer<typeof speechRecognitionRequestSchema>;
export type ConversationStartRequest = z.infer<typeof conversationStartRequestSchema>;
export type ConversationTurnRequest = z.infer<typeof conversationTurnRequestSchema>;
export type ConversationResumeRequest = z.infer<typeof conversationResumeRequestSchema>;
export type ConversationTurn = z.infer<typeof conversationTurnSchema>;
export type ConversationState = z.infer<typeof conversationStateSchema>;

// New billing types
export type BillingPlan = typeof billingPlans.$inferSelect;
export type InsertBillingPlan = z.infer<typeof insertBillingPlanSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;
export type RefundRequest = typeof refundRequests.$inferSelect;
export type InsertRefundRequest = z.infer<typeof insertRefundRequestSchema>;
export type UserUsage = typeof userUsage.$inferSelect;
export type InsertUserUsage = z.infer<typeof insertUserUsageSchema>;
export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type InsertConversationMessage = z.infer<typeof insertConversationMessageSchema>;
