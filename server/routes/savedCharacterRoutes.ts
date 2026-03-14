// Saved character API routes for CRUD and usage tracking.
import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { ApiError, getErrorMessage, getErrorStatus } from "../lib/apiError";
import { parseOrThrow } from "../lib/validate";
import { logError } from "../lib/logger";
import { requireAuthenticated } from "./middleware/authGuard";

const characterGenderSchema = z.enum(['male', 'female']);
const characterStyleSchema = z.enum(['cheerful', 'calm', 'strict']);
const characterAudienceSchema = z.enum(['student', 'general', 'business']);
const savedCharacterIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function registerSavedCharacterRoutes(app: Express) {
  app.get('/api/saved-characters', async (req: any, res) => {
    if (!requireAuthenticated(req, res)) {
      return;
    }

    try {
      const userId = req.user.id;
      const characters = await storage.getUserCharacters(userId);
      res.json(characters);
    } catch (error) {
      logError("Failed to get saved characters", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to get saved characters");
      res.status(status).json({ message });
    }
  });

  app.post('/api/saved-characters', async (req: any, res) => {
    if (!requireAuthenticated(req, res)) {
      return;
    }

    try {
      const createCharacterSchema = z.object({
        name: z.string().trim().min(1),
        gender: characterGenderSchema,
        style: characterStyleSchema,
        imageUrl: z.string().url(),
        audience: characterAudienceSchema,
        scenario: z.string().trim().min(1).optional(),
        backgroundPrompt: z.string().trim().min(1).optional(),
      });
      const parsed = parseOrThrow(createCharacterSchema, req.body);

      const userId = req.user.id;
      const savedCharacter = await storage.saveCharacter({
        userId,
        name: parsed.name,
        gender: parsed.gender,
        style: parsed.style,
        imageUrl: parsed.imageUrl,
        audience: parsed.audience,
        scenario: parsed.scenario,
        backgroundPrompt: parsed.backgroundPrompt,
      });

      res.json(savedCharacter);
    } catch (error) {
      logError("Failed to save character", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to save character");
      res.status(status).json({ message });
    }
  });

  app.get('/api/saved-characters/:id', async (req: any, res) => {
    if (!requireAuthenticated(req, res)) {
      return;
    }

    try {
      const userId = req.user.id;
      const { id: characterId } = parseOrThrow(savedCharacterIdParamsSchema, req.params);

      const character = await storage.getCharacter(characterId, userId);
      if (!character) {
        throw new ApiError(404, "Character not found");
      }

      await storage.updateCharacterUsage(characterId);
      res.json(character);
    } catch (error) {
      logError("Failed to get character", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to get character");
      res.status(status).json({ message });
    }
  });

  app.delete('/api/saved-characters/:id', async (req: any, res) => {
    if (!requireAuthenticated(req, res)) {
      return;
    }

    try {
      const userId = req.user.id;
      const { id: characterId } = parseOrThrow(savedCharacterIdParamsSchema, req.params);

      const deleted = await storage.deleteCharacter(characterId, userId);
      if (!deleted) {
        throw new ApiError(404, "Character not found");
      }

      res.json({ message: "Character deleted successfully" });
    } catch (error) {
      logError("Failed to delete character", error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, "Failed to delete character");
      res.status(status).json({ message });
    }
  });
}
