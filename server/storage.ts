import {
  users,
  learningSessions,
  savedCharacters,
  type User,
  type UpsertUser,
  type InsertSession,
  type LearningSession,
  type InsertSavedCharacter,
  type SavedCharacter,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// Interface for storage operations
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
  
  // Saved character methods
  saveCharacter(characterData: InsertSavedCharacter): Promise<SavedCharacter>;
  getUserCharacters(userId: string): Promise<SavedCharacter[]>;
  getCharacter(id: string, userId: string): Promise<SavedCharacter | undefined>;
  updateCharacterUsage(id: string): Promise<void>;
  deleteCharacter(id: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
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
