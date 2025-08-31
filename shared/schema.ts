import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
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
  paymentProvider: varchar("payment_provider"), // portone, toss, paddle
  customerId: varchar("customer_id"),
  subscriptionId: varchar("subscription_id"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
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
  language: z.enum(['en', 'ko']).default('en'),
});

export const conversationTurnSchema = z.object({
  speaker: z.enum(['user', 'character']),
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
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  isListening: z.boolean(),
  isWaitingForResponse: z.boolean(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertSavedCharacter = z.infer<typeof insertSavedCharacterSchema>;
export type LearningSession = typeof learningSessions.$inferSelect;
export type SavedCharacter = typeof savedCharacters.$inferSelect;
export type Character = z.infer<typeof characterSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
export type GenerateImageRequest = z.infer<typeof generateImageRequestSchema>;
export type GenerateDialogueRequest = z.infer<typeof generateDialogueRequestSchema>;
export type TTSRequest = z.infer<typeof ttsRequestSchema>;
export type SpeechRecognitionRequest = z.infer<typeof speechRecognitionRequestSchema>;
export type ConversationTurn = z.infer<typeof conversationTurnSchema>;
export type ConversationState = z.infer<typeof conversationStateSchema>;
