import {
  users,
  learningSessions,
  savedCharacters,
  conversationSessions as conversationSessionsTable,
  conversationMessages as conversationMessagesTable,
  promptTemplates as promptTemplatesTable,
  masterConfigs as masterConfigsTable,
  codeStandards as codeStandardsTable,
  type User,
  type UpsertUser,
  type InsertSession,
  type LearningSession,
  type InsertSavedCharacter,
  type SavedCharacter,
  type ConversationSessionRecord,
  type ConversationMessageRecord,
  type PromptTemplateRecord,
  type MasterConfigRecord,
  type CodeStandardRecord,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import crypto from "node:crypto";

const MAX_PERSISTED_CONVERSATION_MESSAGES = 120;

// Interface for storage operations

export type ConversationHistoryItem = {
  speaker: 'user' | 'assistant' | 'character';
  text: string;
  timestamp: number;
};

export type ConversationFeedback = {
  accuracy: number;
  suggestions: string[];
  pronunciation: string;
};

export type ConversationSession = {
  sessionId: string;
  userId: string;
  scenarioId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  characterId: string;
  userGoal: string;
  history: ConversationHistoryItem[];
  lastFeedback?: ConversationFeedback;
};

export type PromptTemplateKey = 'conversation_system' | 'conversation_initial_prompt';

export type PromptTemplate = {
  templateKey: PromptTemplateKey;
  scenarioId?: string;
  difficulty?: ConversationSession['difficulty'];
  content: string;
  version: string;
  description?: string;
  updatedBy?: string;
  isActive: boolean;
};


export type UpsertPromptTemplateInput = {
  templateKey: PromptTemplateKey;
  scenarioId?: string;
  difficulty?: ConversationSession['difficulty'];
  content: string;
  version?: string;
  description?: string;
  updatedBy?: string;
  isActive?: boolean;
};


export type MasterConfig = {
  configKey: string;
  configValue: Record<string, unknown>;
  isActive: boolean;
};

export type CodeStandard = {
  standardKey: string;
  category: string;
  title: string;
  body: string;
  severity: 'required' | 'recommended' | 'advisory';
  isActive: boolean;
};


export type UpsertMasterConfigInput = {
  configKey: string;
  configValue: Record<string, unknown>;
  isActive?: boolean;
};

export type UpsertCodeStandardInput = {
  standardKey: string;
  category: string;
  title: string;
  body: string;
  severity?: CodeStandard['severity'];
  isActive?: boolean;
};

export interface IStorage {


  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Learning session methods
  createSession(session: InsertSession): Promise<LearningSession>;
  getSession(id: string): Promise<LearningSession | undefined>;
  updateSession(id: string, updates: Partial<LearningSession>): Promise<LearningSession | undefined>;
  getUserSessions(userId: string): Promise<LearningSession[]>;
  
  // Subscription methods
  updateUserSubscription(userId: string, subscriptionData: Partial<User>): Promise<User | undefined>;
  
  // Admin methods
  getAllUsers(): Promise<User[]>;
  resetUserUsage(userId: string): Promise<User | undefined>;
  
  // Usage tracking methods
  incrementUsage(userId: string, type: 'conversation' | 'imageGeneration' | 'tts'): Promise<void>;
  
  // Conversation session methods (Plan 02 Sprint 1 draft)
  createConversationSession(session: Omit<ConversationSession, 'history' | 'sessionId'>): Promise<ConversationSession>;
  getConversationSession(sessionId: string, userId: string): Promise<ConversationSession | undefined>;
  saveConversationTurn(sessionId: string, userId: string, history: ConversationHistoryItem[], feedback?: ConversationFeedback): Promise<ConversationSession | undefined>;
  getConversationMessages(sessionId: string, userId: string): Promise<ConversationHistoryItem[]>;
  getPromptTemplate(templateKey: PromptTemplateKey, scenarioId?: string, difficulty?: ConversationSession['difficulty']): Promise<PromptTemplate | undefined>;
  getPromptTemplates(templateKey?: PromptTemplateKey): Promise<PromptTemplate[]>;
  upsertPromptTemplate(input: UpsertPromptTemplateInput): Promise<PromptTemplate>;
  deactivatePromptTemplate(templateKey: PromptTemplateKey, scenarioId?: string, difficulty?: ConversationSession['difficulty']): Promise<boolean>;
  getMasterConfig(configKey: string): Promise<MasterConfig | undefined>;
  upsertMasterConfig(input: UpsertMasterConfigInput): Promise<MasterConfig>;
  deactivateMasterConfig(configKey: string): Promise<boolean>;
  getCodeStandards(category?: string): Promise<CodeStandard[]>;
  upsertCodeStandard(input: UpsertCodeStandardInput): Promise<CodeStandard>;
  deactivateCodeStandard(standardKey: string, category: string): Promise<boolean>;

  // Saved character methods
  saveCharacter(characterData: InsertSavedCharacter): Promise<SavedCharacter>;
  getUserCharacters(userId: string): Promise<SavedCharacter[]>;
  getCharacter(id: string, userId: string): Promise<SavedCharacter | undefined>;
  updateCharacterUsage(id: string): Promise<void>;
  deleteCharacter(id: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  private readonly conversationSessions = new Map<string, ConversationSession>();
  private readonly promptTemplates = new Map<string, PromptTemplate>();
  private readonly masterConfigs = new Map<string, MasterConfig>();
  private readonly codeStandards = new Map<string, CodeStandard[]>();

  private mapConversationSessionRecord(record: ConversationSessionRecord): ConversationSession {
    return {
      sessionId: record.id,
      userId: record.userId,
      scenarioId: record.scenarioId,
      difficulty: record.difficulty as ConversationSession['difficulty'],
      characterId: record.characterId,
      userGoal: record.userGoal,
      history: record.history ?? [],
      lastFeedback: record.lastFeedback ?? undefined,
    };
  }



  private mapPromptTemplateRecord(record: PromptTemplateRecord): PromptTemplate {
    return {
      templateKey: record.templateKey as PromptTemplateKey,
      scenarioId: record.scenarioId ?? undefined,
      difficulty: (record.difficulty as ConversationSession['difficulty'] | null) ?? undefined,
      content: record.content,
      version: record.version ?? 'v1',
      description: record.description ?? undefined,
      updatedBy: record.updatedBy ?? undefined,
      isActive: record.isActive ?? true,
    };
  }

  private buildPromptTemplateMapKey(templateKey: PromptTemplateKey, scenarioId?: string, difficulty?: ConversationSession['difficulty']): string {
    return [templateKey, scenarioId ?? '*', difficulty ?? '*'].join('::');
  }


  private mapMasterConfigRecord(record: MasterConfigRecord): MasterConfig {
    return {
      configKey: record.configKey,
      configValue: (record.configValue ?? {}) as Record<string, unknown>,
      isActive: record.isActive ?? true,
    };
  }

  private mapCodeStandardRecord(record: CodeStandardRecord): CodeStandard {
    return {
      standardKey: record.standardKey,
      category: record.category,
      title: record.title,
      body: record.body,
      severity: (record.severity as CodeStandard['severity'] | null) ?? 'recommended',
      isActive: record.isActive ?? true,
    };
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Learning session operations
  async createSession(sessionData: InsertSession): Promise<LearningSession> {
    const [session] = await db.insert(learningSessions).values(sessionData as any).returning();
    return session;
  }

  async getSession(id: string): Promise<LearningSession | undefined> {
    const [session] = await db.select().from(learningSessions).where(eq(learningSessions.id, id));
    return session;
  }

  async updateSession(id: string, updates: Partial<LearningSession>): Promise<LearningSession | undefined> {
    const [session] = await db
      .update(learningSessions)
      .set(updates)
      .where(eq(learningSessions.id, id))
      .returning();
    return session;
  }

  async getUserSessions(userId: string): Promise<LearningSession[]> {
    return db.select().from(learningSessions).where(eq(learningSessions.userId, userId));
  }

  // Subscription operations
  async updateUserSubscription(userId: string, subscriptionData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...subscriptionData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users).orderBy(users.createdAt);
    return allUsers;
  }

  async resetUserUsage(userId: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        conversationCount: "0",
        imageGenerationCount: "0", 
        ttsUsageCount: "0",
        dailyUsageCount: "0",
        monthlyImageCount: "0",
        lastUsageReset: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  async incrementUsage(userId: string, type: 'conversation' | 'imageGeneration' | 'tts'): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const updates: Partial<User> = { updatedAt: new Date() };
    
    switch (type) {
      case 'conversation':
        updates.conversationCount = String(parseInt(user.conversationCount || '0') + 1);
        break;
      case 'imageGeneration':
        updates.imageGenerationCount = String(parseInt(user.imageGenerationCount || '0') + 1);
        break;
      case 'tts':
        updates.ttsUsageCount = String(parseInt(user.ttsUsageCount || '0') + 1);
        break;
    }

    await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId));
  }


  // Conversation session operations (Plan 02 Sprint 1 draft)
  async createConversationSession(sessionData: Omit<ConversationSession, 'history' | 'sessionId'>): Promise<ConversationSession> {
    const sessionId = crypto.randomUUID();
    const session: ConversationSession = {
      ...sessionData,
      sessionId,
      history: [],
    };

    try {
      const [created] = await db
        .insert(conversationSessionsTable)
        .values({
          id: sessionId,
          userId: session.userId,
          scenarioId: session.scenarioId,
          difficulty: session.difficulty,
          characterId: session.characterId,
          userGoal: session.userGoal,
          history: [],
          updatedAt: new Date(),
        })
        .returning();

      return this.mapConversationSessionRecord(created);
    } catch {
      this.conversationSessions.set(sessionId, session);
      return session;
    }
  }

  async getConversationSession(sessionId: string, userId: string): Promise<ConversationSession | undefined> {
    try {
      const [session] = await db
        .select()
        .from(conversationSessionsTable)
        .where(and(eq(conversationSessionsTable.id, sessionId), eq(conversationSessionsTable.userId, userId)));

      if (session) {
        return this.mapConversationSessionRecord(session);
      }
    } catch {
      // fallback to in-memory draft storage when DB table is not available
    }

    const memorySession = this.conversationSessions.get(sessionId);
    if (!memorySession || memorySession.userId !== userId) {
      return undefined;
    }
    return memorySession;
  }

  async saveConversationTurn(
    sessionId: string,
    userId: string,
    history: ConversationHistoryItem[],
    feedback?: ConversationFeedback,
  ): Promise<ConversationSession | undefined> {
    const session = await this.getConversationSession(sessionId, userId);
    if (!session) {
      return undefined;
    }

    const boundedHistory = history.slice(-MAX_PERSISTED_CONVERSATION_MESSAGES);

    try {
      const [updated] = await db
        .update(conversationSessionsTable)
        .set({
          history: boundedHistory,
          lastFeedback: feedback,
          updatedAt: new Date(),
        })
        .where(and(eq(conversationSessionsTable.id, sessionId), eq(conversationSessionsTable.userId, userId)))
        .returning();

      const candidateTurns = boundedHistory.slice(-2);
      if (candidateTurns.length > 0) {
        const persistedTail = await db
          .select({
            speaker: conversationMessagesTable.speaker,
            text: conversationMessagesTable.text,
            timestamp: conversationMessagesTable.timestamp,
          })
          .from(conversationMessagesTable)
          .where(and(eq(conversationMessagesTable.sessionId, sessionId), eq(conversationMessagesTable.userId, userId)))
          .orderBy(desc(conversationMessagesTable.timestamp), desc(conversationMessagesTable.createdAt))
          .limit(candidateTurns.length);

        const normalizedPersistedTail = [...persistedTail]
          .reverse()
          .map((item) => ({
            speaker: item.speaker,
            text: item.text,
            timestamp: item.timestamp ? item.timestamp.getTime() : 0,
          }));

        const isSameTail =
          normalizedPersistedTail.length === candidateTurns.length &&
          normalizedPersistedTail.every((item, index) => (
            item.speaker === candidateTurns[index].speaker &&
            item.text === candidateTurns[index].text &&
            item.timestamp === candidateTurns[index].timestamp
          ));

        if (!isSameTail) {
          await db.insert(conversationMessagesTable).values(
            candidateTurns.map((turn) => ({
              sessionId,
              userId,
              speaker: turn.speaker,
              text: turn.text,
              timestamp: new Date(turn.timestamp),
            })),
          );

          const overflowMessages = await db
            .select({ id: conversationMessagesTable.id })
            .from(conversationMessagesTable)
            .where(and(eq(conversationMessagesTable.sessionId, sessionId), eq(conversationMessagesTable.userId, userId)))
            .orderBy(desc(conversationMessagesTable.timestamp), desc(conversationMessagesTable.createdAt))
            .offset(MAX_PERSISTED_CONVERSATION_MESSAGES);

          if (overflowMessages.length > 0) {
            await db
              .delete(conversationMessagesTable)
              .where(inArray(conversationMessagesTable.id, overflowMessages.map(({ id }) => id)));
          }
        }
      }

      if (updated) {
        return this.mapConversationSessionRecord(updated);
      }
    } catch {
      // fallback to in-memory draft storage when DB table is not available
    }

    const updatedSession: ConversationSession = {
      ...session,
      history: boundedHistory,
      lastFeedback: feedback,
    };
    this.conversationSessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  async getConversationMessages(sessionId: string, userId: string): Promise<ConversationHistoryItem[]> {
    try {
      const latestMessages = await db
        .select()
        .from(conversationMessagesTable)
        .where(and(eq(conversationMessagesTable.sessionId, sessionId), eq(conversationMessagesTable.userId, userId)))
        .orderBy(desc(conversationMessagesTable.timestamp), desc(conversationMessagesTable.createdAt))
        .limit(MAX_PERSISTED_CONVERSATION_MESSAGES);

      const messages = [...latestMessages].reverse();

      return messages.map((message: ConversationMessageRecord) => ({
        speaker: message.speaker as ConversationHistoryItem['speaker'],
        text: message.text,
        timestamp: (message.timestamp ?? message.createdAt ?? new Date(0)).getTime(),
      }));
    } catch {
      const session = this.conversationSessions.get(sessionId);
      if (!session || session.userId !== userId) {
        return [];
      }
      return session.history;
    }
  }

  async getPromptTemplate(templateKey: PromptTemplateKey, scenarioId?: string, difficulty?: ConversationSession['difficulty']): Promise<PromptTemplate | undefined> {
    const combinations: Array<{ scenarioId?: string; difficulty?: ConversationSession['difficulty'] }> = [
      { scenarioId, difficulty },
      { scenarioId, difficulty: undefined },
      { scenarioId: undefined, difficulty },
      { scenarioId: undefined, difficulty: undefined },
    ];

    try {
      for (const candidate of combinations) {
        const query = await db
          .select()
          .from(promptTemplatesTable)
          .where(and(
            eq(promptTemplatesTable.templateKey, templateKey),
            candidate.scenarioId ? eq(promptTemplatesTable.scenarioId, candidate.scenarioId) : sql`${promptTemplatesTable.scenarioId} is null`,
            candidate.difficulty ? eq(promptTemplatesTable.difficulty, candidate.difficulty) : sql`${promptTemplatesTable.difficulty} is null`,
            eq(promptTemplatesTable.isActive, true),
          ))
          .orderBy(desc(promptTemplatesTable.updatedAt))
          .limit(1);

        if (query[0]) {
          return this.mapPromptTemplateRecord(query[0]);
        }
      }
    } catch {
      // fallback to in-memory prompt registry when DB table is not available
    }

    for (const candidate of combinations) {
      const key = this.buildPromptTemplateMapKey(templateKey, candidate.scenarioId, candidate.difficulty);
      const template = this.promptTemplates.get(key);
      if (template?.isActive) {
        return template;
      }
    }

    return undefined;
  }


  async getPromptTemplates(templateKey?: PromptTemplateKey): Promise<PromptTemplate[]> {
    try {
      const records = await db
        .select()
        .from(promptTemplatesTable)
        .where(and(
          eq(promptTemplatesTable.isActive, true),
          templateKey ? eq(promptTemplatesTable.templateKey, templateKey) : sql`true`,
        ))
        .orderBy(desc(promptTemplatesTable.updatedAt));

      return records.map((record) => this.mapPromptTemplateRecord(record));
    } catch {
      // fallback to in-memory prompt registry when DB table is not available
    }

    const values = Array.from(this.promptTemplates.values()).filter((item) => item.isActive);
    return templateKey ? values.filter((item) => item.templateKey === templateKey) : values;
  }

  async upsertPromptTemplate(input: UpsertPromptTemplateInput): Promise<PromptTemplate> {
    const normalized: PromptTemplate = {
      templateKey: input.templateKey,
      scenarioId: input.scenarioId?.trim() || undefined,
      difficulty: input.difficulty,
      content: input.content.trim(),
      version: input.version?.trim() || 'v1',
      description: input.description?.trim() || undefined,
      updatedBy: input.updatedBy?.trim() || undefined,
      isActive: input.isActive ?? true,
    };

    try {
      const [existing] = await db
        .select({ id: promptTemplatesTable.id })
        .from(promptTemplatesTable)
        .where(and(
          eq(promptTemplatesTable.templateKey, normalized.templateKey),
          normalized.scenarioId ? eq(promptTemplatesTable.scenarioId, normalized.scenarioId) : sql`${promptTemplatesTable.scenarioId} is null`,
          normalized.difficulty ? eq(promptTemplatesTable.difficulty, normalized.difficulty) : sql`${promptTemplatesTable.difficulty} is null`,
        ))
        .orderBy(desc(promptTemplatesTable.updatedAt))
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(promptTemplatesTable)
          .set({
            content: normalized.content,
            version: normalized.version,
            description: normalized.description ?? null,
            updatedBy: normalized.updatedBy ?? null,
            isActive: normalized.isActive,
            updatedAt: new Date(),
          })
          .where(eq(promptTemplatesTable.id, existing.id))
          .returning();
        if (updated) return this.mapPromptTemplateRecord(updated);
      } else {
        const [created] = await db
          .insert(promptTemplatesTable)
          .values({
            templateKey: normalized.templateKey,
            scenarioId: normalized.scenarioId ?? null,
            difficulty: normalized.difficulty ?? null,
            content: normalized.content,
            version: normalized.version,
            description: normalized.description ?? null,
            updatedBy: normalized.updatedBy ?? null,
            isActive: normalized.isActive,
            updatedAt: new Date(),
          })
          .returning();
        if (created) return this.mapPromptTemplateRecord(created);
      }
    } catch {
      // fallback to in-memory prompt registry when DB table is not available
    }

    const key = this.buildPromptTemplateMapKey(normalized.templateKey, normalized.scenarioId, normalized.difficulty);
    this.promptTemplates.set(key, normalized);
    return normalized;
  }


  async deactivatePromptTemplate(templateKey: PromptTemplateKey, scenarioId?: string, difficulty?: ConversationSession['difficulty']): Promise<boolean> {
    const normalizedScenarioId = scenarioId?.trim() || undefined;

    try {
      const updated = await db
        .update(promptTemplatesTable)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(
          eq(promptTemplatesTable.templateKey, templateKey),
          normalizedScenarioId ? eq(promptTemplatesTable.scenarioId, normalizedScenarioId) : sql`${promptTemplatesTable.scenarioId} is null`,
          difficulty ? eq(promptTemplatesTable.difficulty, difficulty) : sql`${promptTemplatesTable.difficulty} is null`,
        ))
        .returning({ id: promptTemplatesTable.id });

      if (updated.length > 0) {
        return true;
      }
    } catch {
      // fallback to in-memory prompt registry when DB table is not available
    }

    const key = this.buildPromptTemplateMapKey(templateKey, normalizedScenarioId, difficulty);
    const existing = this.promptTemplates.get(key);
    if (!existing) {
      return false;
    }
    this.promptTemplates.set(key, { ...existing, isActive: false });
    return true;
  }


  async getMasterConfig(configKey: string): Promise<MasterConfig | undefined> {
    try {
      const [record] = await db
        .select()
        .from(masterConfigsTable)
        .where(and(eq(masterConfigsTable.configKey, configKey), eq(masterConfigsTable.isActive, true)))
        .orderBy(desc(masterConfigsTable.updatedAt))
        .limit(1);

      if (record) {
        return this.mapMasterConfigRecord(record);
      }
    } catch {
      // fallback to in-memory master config registry when DB table is not available
    }

    const memoryConfig = this.masterConfigs.get(configKey);
    if (memoryConfig?.isActive) {
      return memoryConfig;
    }

    return undefined;
  }


  async upsertMasterConfig(input: UpsertMasterConfigInput): Promise<MasterConfig> {
    const normalized: MasterConfig = {
      configKey: input.configKey.trim(),
      configValue: input.configValue,
      isActive: input.isActive ?? true,
    };

    try {
      const [record] = await db
        .insert(masterConfigsTable)
        .values({
          configKey: normalized.configKey,
          configValue: normalized.configValue,
          isActive: normalized.isActive,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: masterConfigsTable.configKey,
          set: {
            configValue: normalized.configValue,
            isActive: normalized.isActive,
            updatedAt: new Date(),
          },
        })
        .returning();

      if (record) {
        return this.mapMasterConfigRecord(record);
      }
    } catch {
      // fallback to in-memory master config registry when DB table is not available
    }

    this.masterConfigs.set(normalized.configKey, normalized);
    return normalized;
  }


  async deactivateMasterConfig(configKey: string): Promise<boolean> {
    const normalizedKey = configKey.trim();
    try {
      const updated = await db
        .update(masterConfigsTable)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(masterConfigsTable.configKey, normalizedKey))
        .returning({ id: masterConfigsTable.id });

      if (updated.length > 0) {
        return true;
      }
    } catch {
      // fallback to in-memory master config registry when DB table is not available
    }

    const existing = this.masterConfigs.get(normalizedKey);
    if (!existing) {
      return false;
    }
    this.masterConfigs.set(normalizedKey, { ...existing, isActive: false });
    return true;
  }

  async getCodeStandards(category?: string): Promise<CodeStandard[]> {
    try {
      const records = await db
        .select()
        .from(codeStandardsTable)
        .where(and(
          eq(codeStandardsTable.isActive, true),
          category ? eq(codeStandardsTable.category, category) : sql`true`,
        ))
        .orderBy(desc(codeStandardsTable.updatedAt));

      return records.map((record) => this.mapCodeStandardRecord(record));
    } catch {
      // fallback to in-memory code standards registry when DB table is not available
    }

    if (category) {
      return this.codeStandards.get(category) ?? [];
    }

    return Array.from(this.codeStandards.values()).flat();
  }


  async upsertCodeStandard(input: UpsertCodeStandardInput): Promise<CodeStandard> {
    const normalized: CodeStandard = {
      standardKey: input.standardKey.trim(),
      category: input.category.trim(),
      title: input.title.trim(),
      body: input.body.trim(),
      severity: input.severity ?? 'recommended',
      isActive: input.isActive ?? true,
    };

    try {
      const [existing] = await db
        .select({ id: codeStandardsTable.id })
        .from(codeStandardsTable)
        .where(and(
          eq(codeStandardsTable.standardKey, normalized.standardKey),
          eq(codeStandardsTable.category, normalized.category),
        ))
        .orderBy(desc(codeStandardsTable.updatedAt))
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(codeStandardsTable)
          .set({
            title: normalized.title,
            body: normalized.body,
            severity: normalized.severity,
            isActive: normalized.isActive,
            updatedAt: new Date(),
          })
          .where(eq(codeStandardsTable.id, existing.id))
          .returning();

        if (updated) {
          return this.mapCodeStandardRecord(updated);
        }
      } else {
        const [created] = await db
          .insert(codeStandardsTable)
          .values({
            standardKey: normalized.standardKey,
            category: normalized.category,
            title: normalized.title,
            body: normalized.body,
            severity: normalized.severity,
            isActive: normalized.isActive,
            updatedAt: new Date(),
          })
          .returning();

        if (created) {
          return this.mapCodeStandardRecord(created);
        }
      }
    } catch {
      // fallback to in-memory code standards registry when DB table is not available
    }

    const categoryItems = this.codeStandards.get(normalized.category) ?? [];
    const nextItems = categoryItems.filter((item) => item.standardKey !== normalized.standardKey);
    nextItems.push(normalized);
    this.codeStandards.set(normalized.category, nextItems);
    return normalized;
  }


  async deactivateCodeStandard(standardKey: string, category: string): Promise<boolean> {
    const normalizedStandardKey = standardKey.trim();
    const normalizedCategory = category.trim();

    try {
      const updated = await db
        .update(codeStandardsTable)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(
          eq(codeStandardsTable.standardKey, normalizedStandardKey),
          eq(codeStandardsTable.category, normalizedCategory),
        ))
        .returning({ id: codeStandardsTable.id });

      if (updated.length > 0) {
        return true;
      }
    } catch {
      // fallback to in-memory code standards registry when DB table is not available
    }

    const items = this.codeStandards.get(normalizedCategory) ?? [];
    const idx = items.findIndex((item) => item.standardKey === normalizedStandardKey);
    if (idx === -1) {
      return false;
    }

    const nextItems = [...items];
    nextItems[idx] = { ...nextItems[idx], isActive: false };
    this.codeStandards.set(normalizedCategory, nextItems);
    return true;
  }


  // Saved character operations
  async saveCharacter(characterData: InsertSavedCharacter): Promise<SavedCharacter> {
    const [character] = await db.insert(savedCharacters).values(characterData).returning();
    return character;
  }

  async getUserCharacters(userId: string): Promise<SavedCharacter[]> {
    const characters = await db
      .select()
      .from(savedCharacters)
      .where(eq(savedCharacters.userId, userId))
      .orderBy(savedCharacters.createdAt);
    return characters;
  }

  async getCharacter(id: string, userId: string): Promise<SavedCharacter | undefined> {
    const [character] = await db
      .select()
      .from(savedCharacters)
      .where(and(eq(savedCharacters.id, id), eq(savedCharacters.userId, userId)));
    return character;
  }

  async updateCharacterUsage(id: string): Promise<void> {
    const [character] = await db
      .select()
      .from(savedCharacters)
      .where(eq(savedCharacters.id, id));
    
    if (character) {
      const newUsageCount = String(parseInt(character.usageCount || '0') + 1);
      await db
        .update(savedCharacters)
        .set({
          usageCount: newUsageCount,
          lastUsedAt: new Date(),
        })
        .where(eq(savedCharacters.id, id));
    }
  }

  async deleteCharacter(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(savedCharacters)
      .where(and(eq(savedCharacters.id, id), eq(savedCharacters.userId, userId)))
      .returning();
    
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
