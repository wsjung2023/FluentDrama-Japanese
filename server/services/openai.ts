import OpenAI from "openai";
import type { GenerateImageRequest, GenerateDialogueRequest } from "@shared/schema";
import { buildDialoguePrompts } from "./dialoguePromptBuilder";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

export async function generateCharacterImage(request: GenerateImageRequest): Promise<{ imageUrl: string }> {
  const { name, gender, style, audience, scenario } = request;
  
  // Define professional backgrounds based on scenario context
  const getScenarioBackground = (scenario: string) => {
    const backgrounds = {
      restaurant: "elegant restaurant interior with dining tables and ambient lighting",
      airport: "modern airport terminal with check-in counters and departure boards",
      coffee_shop: "trendy coffee shop with espresso machines and cozy seating",
      office: "professional corporate office with modern furniture",
      school: "bright classroom with educational materials and whiteboards",
      hotel: "luxurious hotel lobby with reception desk and elegant decor"
    };
    return backgrounds[scenario as keyof typeof backgrounds] || "professional indoor setting";
  };

  // Define style characteristics
  const styleMap = {
    cheerful: "bright smile, friendly expression, energetic pose",
    calm: "serene expression, gentle demeanor, relaxed posture", 
    strict: "serious expression, professional appearance, confident stance"
  };

  // Get scenario-specific background
  const background = scenario ? getScenarioBackground(scenario) : `professional setting suitable for ${audience} level Japanese learning`;
  
  // Get appropriate outfit and pose based on scenario and style
  const getOutfitForScenario = (scenario: string, style: string) => {
    const outfits = {
      restaurant: style === 'strict' ? 'formal server uniform, black apron' : 'casual restaurant uniform, friendly smile',
      airport: 'professional flight attendant uniform, name badge',
      coffee_shop: 'casual barista apron over comfortable clothing',
      business_meeting: 'professional business attire, suit or blazer',
      hotel: 'elegant concierge uniform, professional appearance',
      cafeteria: 'casual food service uniform, hair net, friendly demeanor',
      club: 'casual student clothing, club t-shirt or hoodie'
    };
    return outfits[scenario as keyof typeof outfits] || 'professional casual attire';
  };

  const getPoseForStyle = (style: string) => {
    const poses: Record<string, string> = {
      cheerful: 'standing confidently with warm welcoming gesture',
      calm: 'standing peacefully with relaxed, approachable posture',
      strict: 'standing professionally with confident, authoritative stance'
    };
    return poses[style] || 'standing naturally with friendly posture';
  };

  const outfit = getOutfitForScenario(scenario || 'restaurant', style);
  const pose = getPoseForStyle(style);
  
  const prompt = `A vertical portrait photo of a Japanese or East Asian ${gender} person, head-to-toe fully visible in frame, include feet, standing ${pose}, wearing ${outfit}, at ${background}.
ETHNICITY: Japanese or East Asian features, natural Japanese/Korean appearance, realistic Asian facial features.
IMPORTANT: ${gender} gender must be clearly visible and accurately depicted.
BACKGROUND: Realistic Japanese setting matching the scenario - authentic ${background} environment.
Ultra photorealistic, unedited RAW look, natural skin texture and pores, realistic proportions.
Shot on DSLR, 35–50mm lens, f/2.8, soft natural light, slight film grain, shallow depth of field, balanced colors.
Composition: VERTICAL orientation only (portrait mode, taller than wide), full-body, subject smaller in frame, wider framing, subject centered, clean background separation (subtle bokeh).
No illustration, no anime, no 3D render, no doll-like face, no over-smoothing, no plastic skin, no exaggerated eyes, no horizontal/landscape orientation.`;

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1792", // 9:16 ratio for better full body shots
      quality: "hd",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error("No image URL returned from OpenAI");
    }

    return { imageUrl };
  } catch (error) {
    console.error("OpenAI image generation failed:", error);
    throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateDialogue(request: GenerateDialogueRequest): Promise<{
  lines: string[];
  focus_phrases: string[];
}> {
  const { systemPrompt, userPrompt } = buildDialoguePrompts(request);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    const result = JSON.parse(content);
    
    // Validate the response structure
    if (!result.lines || !Array.isArray(result.lines) || result.lines.length !== 3) {
      throw new Error("Invalid lines format in OpenAI response");
    }
    
    if (!result.focus_phrases || !Array.isArray(result.focus_phrases) || result.focus_phrases.length !== 3) {
      throw new Error("Invalid focus_phrases format in OpenAI response");
    }

    return {
      lines: result.lines,
      focus_phrases: result.focus_phrases
    };
  } catch (error) {
    console.error("OpenAI dialogue generation failed:", error);
    throw new Error(`Dialogue generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
