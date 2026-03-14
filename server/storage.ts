import {
  users,
  learningSessions,
  savedCharacters,
  conversationSessions as conversationSessionsTable,
  conversationMessages as conversationMessagesTable,
  type User,
  type UpsertUser,
  type InsertSession,
  type LearningSession,
  type InsertSavedCharacter,
  type SavedCharacter,
  type ConversationSessionRecord,
  type ConversationMessageRecord,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, asc, desc } from "drizzle-orm";
import crypto from "node:crypto";

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

  // Saved character methods
  saveCharacter(characterData: InsertSavedCharacter): Promise<SavedCharacter>;
  getUserCharacters(userId: string): Promise<SavedCharacter[]>;
  getCharacter(id: string, userId: string): Promise<SavedCharacter | undefined>;
  updateCharacterUsage(id: string): Promise<void>;
  deleteCharacter(id: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  private readonly conversationSessions = new Map<string, ConversationSession>();

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
    
    // Always increment dailyUsageCount for all usage types
    const currentDailyUsage = parseInt(user.dailyUsageCount || '0');
    updates.dailyUsageCount = String(currentDailyUsage + 1);
    
    switch (type) {
      case 'conversation':
        updates.conversationCount = String(parseInt(user.conversationCount || '0') + 1);
        break;
      case 'imageGeneration':
        updates.imageGenerationCount = String(parseInt(user.imageGenerationCount || '0') + 1);
        updates.monthlyImageCount = String(parseInt(user.monthlyImageCount || '0') + 1);
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

    try {
      const [updated] = await db
        .update(conversationSessionsTable)
        .set({
          history,
          lastFeedback: feedback,
          updatedAt: new Date(),
        })
        .where(and(eq(conversationSessionsTable.id, sessionId), eq(conversationSessionsTable.userId, userId)))
        .returning();

      const candidateTurns = history.slice(-2);
      if (candidateTurns.length > 0) {
        const persistedTail = await db
          .select({
            speaker: conversationMessagesTable.speaker,
            text: conversationMessagesTable.text,
            timestamp: conversationMessagesTable.timestamp,
          })
          .from(conversationMessagesTable)
          .where(and(eq(conversationMessagesTable.sessionId, sessionId), eq(conversationMessagesTable.userId, userId)))
          .orderBy(desc(conversationMessagesTable.createdAt))
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
      history,
      lastFeedback: feedback,
    };
    this.conversationSessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  async getConversationMessages(sessionId: string, userId: string): Promise<ConversationHistoryItem[]> {
    try {
      const messages = await db
        .select()
        .from(conversationMessagesTable)
        .where(and(eq(conversationMessagesTable.sessionId, sessionId), eq(conversationMessagesTable.userId, userId)))
        .orderBy(asc(conversationMessagesTable.timestamp), asc(conversationMessagesTable.createdAt));

      return messages.map((message: ConversationMessageRecord) => ({
        speaker: message.speaker as ConversationHistoryItem['speaker'],
        text: message.text,
        timestamp: message.timestamp ? message.timestamp.getTime() : Date.now(),
      }));
    } catch {
      const session = this.conversationSessions.get(sessionId);
      if (!session || session.userId !== userId) {
        return [];
      }
      return session.history;
    }
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
