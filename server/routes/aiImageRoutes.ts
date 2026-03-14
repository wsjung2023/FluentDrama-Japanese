// AI image-generation route with monthly image limit checks and auto-save behavior.
import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAuthenticated } from "./middleware/authGuard";
import { parseOrThrow } from "../lib/validate";
import { getErrorMessage, getErrorStatus } from "../lib/apiError";
import { logError } from "../lib/logger";

const backgroundPromptSchema = z.object({
  backgroundSetting: z.string().optional(),
  appropriateOutfit: z.string().optional(),
  characterPose: z.string().optional(),
});

export function registerAiImageRoutes(app: Express) {
  app.post('/api/generate-image', async (req: any, res) => {
    if (!requireAuthenticated(req, res)) {
      return;
    }

    try {
      const imageSchema = z.object({
        name: z.string().min(1),
        gender: z.enum(['male', 'female']),
        style: z.enum(['cheerful', 'calm', 'strict']),
        audience: z.enum(['student', 'general', 'business']),
        scenario: z.string().optional(),
        customScenarioText: z.string().optional(),
        backgroundPrompt: backgroundPromptSchema.optional(),
      });
      const { name, gender, style, audience, scenario, customScenarioText, backgroundPrompt } = parseOrThrow(imageSchema, req.body);
      const userId = req.user.id;

      const imageUsageCheck = await checkImageUsageLimit(userId);
      if (!imageUsageCheck.canUse) {
        return res.status(429).json({
          message: "이미지 생성 한도에 도달했습니다. 기존 캐릭터를 재사용하거나 구독을 업그레이드해주세요.",
          currentUsage: imageUsageCheck.currentUsage,
          limit: imageUsageCheck.limit,
          type: "image_limit_exceeded",
        });
      }

      const getScenarioBackground = (scenario: string) => {
        const backgrounds = {
          restaurant: "elegant restaurant interior with dining tables and ambient lighting",
          airport: "modern airport terminal with check-in counters and departure boards",
          coffee_shop: "trendy coffee shop with espresso machines and cozy seating",
          office: "professional corporate office with modern furniture",
          school: "bright classroom with educational materials and whiteboards",
          hotel: "luxurious hotel lobby with reception desk and elegant decor",
          shopping_mall: "modern shopping center with stores and shoppers",
          hospital: "clean medical facility with professional healthcare setting",
          bank: "professional banking environment with teller counters",
          library: "quiet library with bookshelves and study areas",
        };
        return backgrounds[scenario as keyof typeof backgrounds] || "professional indoor setting";
      };

      const styleMap = {
        cheerful: "bright smile, friendly expression, energetic pose",
        calm: "serene expression, gentle demeanor, relaxed posture",
        strict: "serious expression, professional appearance, confident stance",
      };

      let background;
      if (backgroundPrompt && backgroundPrompt.backgroundSetting) {
        background = backgroundPrompt.backgroundSetting;
      } else if (customScenarioText && customScenarioText.trim()) {
        background = `realistic setting based on: ${customScenarioText.trim()}`;
      } else {
        background = scenario ? getScenarioBackground(scenario) : `professional setting suitable for ${audience} level Japanese learning`;
      }

      const getOutfitForScenario = (scenario: string, style: string) => {
        const outfits = {
          restaurant: style === 'strict' ? 'formal server uniform, black apron' : 'casual restaurant uniform, friendly smile',
          airport: 'professional flight attendant uniform, name badge',
          coffee_shop: 'casual barista apron over comfortable clothing',
          office: 'professional business attire, suit or blazer',
          hotel: 'elegant concierge uniform, professional appearance',
          school: 'professional teacher attire, educational setting appropriate',
          shopping_mall: 'retail employee uniform or casual professional attire',
          hospital: 'medical professional attire, clean and professional',
          bank: 'formal business attire, professional banking appearance',
          library: 'librarian or academic professional attire',
        };
        return outfits[scenario as keyof typeof outfits] || 'professional casual attire';
      };

      const getPoseForStyle = (style: string) => {
        const poses: Record<string, string> = {
          cheerful: 'standing confidently with warm welcoming gesture',
          calm: 'standing peacefully with relaxed, approachable posture',
          strict: 'standing professionally with confident, authoritative stance',
        };
        return poses[style] || 'standing naturally with friendly posture';
      };

      let outfit, pose;
      if (backgroundPrompt) {
        outfit = backgroundPrompt.appropriateOutfit || getOutfitForScenario(scenario || 'restaurant', style);
        pose = backgroundPrompt.characterPose || getPoseForStyle(style);
      } else if (customScenarioText && customScenarioText.trim()) {
        outfit = `appropriate attire for the situation: ${customScenarioText.trim()}`;
        pose = getPoseForStyle(style);
      } else {
        outfit = getOutfitForScenario(scenario || 'restaurant', style);
        pose = getPoseForStyle(style);
      }
      const styleCharacteristics = styleMap[style as keyof typeof styleMap] || "friendly expression";

      const comprehensivePrompt = `FULL LENGTH BODY SHOT: Professional photograph of a real human ${gender} person of Japanese/East Asian ethnicity, ENTIRE BODY visible from head to feet, standing ${pose}, wearing ${outfit}, at ${background}. 

MANDATORY FRAMING: Complete figure visible - head at top 20% of image, feet at bottom 10% of image, showing shoes/footwear. Person should occupy 60-70% of image height to ensure full body is captured without cropping any limbs.

CAMERA SETUP: Positioned 8-10 feet back from subject, wide angle lens (24-35mm equivalent), vertical orientation, adequate space above head and below feet.

Ultra photorealistic, natural Asian skin texture, realistic human proportions, Japanese/East Asian facial features, professional portrait lighting.
High quality DSLR shot, f/2.8, soft natural light, balanced exposure.
ETHNICITY: Japanese or East Asian appearance, distinctive Asian facial features, appropriate hair color and style.

STRICTLY NO: head-and-shoulders only, waist-up shots, cropped legs, cropped feet, tight framing that cuts off any body parts, illustration, no anime, no 3D render, no doll-like face, no over-smoothing, no plastic skin, no exaggerated eyes.`;

      const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: comprehensivePrompt,
          n: 1,
          size: "1024x1792",
          quality: "hd",
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const imageData = await openaiResponse.json();
      const imageUrl = imageData.data[0].url;

      await storage.incrementUsage(userId, 'imageGeneration');

      try {
        const characterData = {
          userId,
          name,
          gender,
          style,
          imageUrl,
          audience,
          scenario: scenario || null,
          backgroundPrompt: backgroundPrompt ? JSON.stringify(backgroundPrompt) : null,
        };

        const savedCharacter = await storage.saveCharacter(characterData);
        console.log(`Character auto-saved with ID: ${savedCharacter.id}`);
      } catch (saveError) {
        console.error("Failed to auto-save character:", saveError);
      }

      res.json({
        imageUrl,
        character: { name, gender, style },
        message: "캐릭터 이미지가 생성되고 저장되었습니다!",
      });
    } catch (error) {
      logError('Image generation error', error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, '이미지 생성 중 오류가 발생했습니다.');
      res.status(status).json({
        message,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  async function checkImageUsageLimit(userId: string) {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return { canUse: false, currentUsage: 0, limit: 0 };
      }

      if (user.email === 'mainstop3@gmail.com' || user.isAdmin === true) {
        return {
          canUse: true,
          currentUsage: 0,
          limit: 999999,
        };
      }

      const tier = user.subscriptionTier || 'free';
      const imageLimits = {
        free: 1,
        starter: 15,
        pro: 25,
        premium: 60,
      };

      const limit = imageLimits[tier as keyof typeof imageLimits] || 1;
      const currentUsage = parseInt(user.imageGenerationCount || '0', 10);

      return {
        canUse: currentUsage < limit,
        currentUsage,
        limit,
      };
    } catch (error) {
      logError('Image usage limit check error', error);
      return { canUse: false, currentUsage: 0, limit: 0 };
    }
  }
}
