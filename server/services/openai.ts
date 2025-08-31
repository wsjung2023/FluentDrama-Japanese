import OpenAI from "openai";
import type { GenerateImageRequest, GenerateDialogueRequest } from "@shared/schema";

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
  const { audience, character, scenario } = request;

  // Define JLPT levels and characteristics for Japanese learning
  const audienceConfig = {
    student: {
      level: "N5-N4",
      vocabulary: "basic Japanese vocabulary, simple sentence patterns like です/ます",
      topics: "school life, daily activities, hobbies"
    },
    general: {
      level: "N4-N3", 
      vocabulary: "intermediate Japanese vocabulary, varied sentence structures",
      topics: "travel, work, social situations, daily life"
    },
    business: {
      level: "N3-N2",
      vocabulary: "advanced Japanese vocabulary, keigo (polite language), complex structures", 
      topics: "professional communication, meetings, negotiations, presentations"
    }
  };

  // Define style characteristics for dialogue
  const styleConfig = {
    cheerful: "enthusiastic, encouraging, uses positive language and exclamation marks",
    calm: "patient, gentle, uses measured pace and reassuring language",
    strict: "focused, direct, uses formal language and clear instructions"
  };

  const config = audienceConfig[audience];
  const scenarioText = scenario.freeText || scenario.presetKey || "general conversation";

  // 커스텀 시나리오인지 확인
  const isCustomScenario = Boolean(scenario.freeText?.trim());
  
  let systemPrompt: string;
  let userPrompt: string;
  
  if (isCustomScenario) {
    // 커스텀 시나리오: 캐릭터가 상황 속 인물 역할
    systemPrompt = `You are ${character.name} in this situation: ${scenarioText}

絶対に日本語だけで話してください。Korean, English, Chinese text is strictly forbidden.
必ず日本語のテキストで応答してください。

ROLE: You are ${character.name}, a character in this scenario. Analyze the situation and respond naturally as someone who would be in this context. Don't assume specific roles unless the scenario explicitly describes your role.
AUDIENCE LEVEL: Adjust language difficulty for ${audience} (${config.level} level)
VOCABULARY: Use ${config.vocabulary}
PERSONALITY: Be ${styleConfig[character.style]}
SITUATION: ${scenarioText}

Generate exactly 3 lines that ${character.name} would naturally say as a person in this scenario.
The lines should be natural conversation, not teaching-focused.
すべてのセリフは日本語で書いてください (hiragana, katakana, kanji).
Also provide 3 useful Japanese phrases that would naturally come up in this situation.

Respond in JSON format:
{
  "lines": ["line1", "line2", "line3"],
  "focus_phrases": ["phrase1", "phrase2", "phrase3"]
}`;

    userPrompt = `The user is in this situation: ${scenarioText}
Start a natural Japanese conversation that fits this scenario. 
Make the dialogue natural and situational, not like a formal lesson.
Language level should be ${config.level}.
IMPORTANT: All dialogue must be in Japanese language only.`;
  } else {
    // 프리셋 시나리오: 기존 튜터 방식
    systemPrompt = `You are ${character.name}, a ${character.style} Japanese tutor for ${audience} level students.

CRITICAL: You must speak ONLY in Japanese. All dialogue lines must be in Japanese text.

AUDIENCE: ${audience} (${config.level} level)
VOCABULARY: Use ${config.vocabulary}
STYLE: Be ${styleConfig[character.style]}
SCENARIO: ${scenarioText}

Generate exactly 3 lines that ${character.name} would say as a Japanese tutor in this scenario. 
All lines must be in Japanese language using hiragana, katakana, and kanji as appropriate.
Also provide 3 useful Japanese focus phrases that are appropriate for this audience level.

Respond in JSON format:
{
  "lines": ["appropriate_line_1", "appropriate_line_2", "appropriate_line_3"],
  "focus_phrases": ["phrase_1", "phrase_2", "phrase_3"]
}

CRITICAL RULE: ABSOLUTELY FORBIDDEN - "今日はどんなことを話したいですか", "今日は何を話しましょう", "何について話したい".

DYNAMIC SCENARIO ANALYSIS SYSTEM:
Analyze the scenario text for keywords and generate contextually appropriate dialogue.

🎓 STUDENT SCENARIOS:
- cafeteria/급식/학식/점심 → "今日のメニューは何ですか？", "一緒に食べませんか？", "美味しそうですね"
- club/동아리/부활동/클럽 → "どのクラブに入りますか？", "今日の活動は何ですか？", "一緒に頑張りましょう"
- homework/숙제/과제/宿題 → "宿題はもう終わりましたか？", "この問題がわかりません", "手伝ってもらえますか？"
- school_trip/수학여행/견학/修学旅行 → "どこに行くか決めましたか？", "楽しみですね", "準備はできていますか？"
- new_friend/새친구/친구만들기/友達 → "はじめまして", "お名前を教えてください", "よろしくお願いします"
- confidence/자신감/용기/自信 → "頑張ってください", "大丈夫ですよ", "練習しましょう"

🏠 GENERAL SCENARIOS:
- travel/여행/관광/旅行 → "どちらまで行かれますか？", "チケットを予約したいです", "道を教えてください"
- cafe/카페/주문/カフェ → "何をお飲みになりますか？", "おすすめはありますか？", "テイクアウトでお願いします"
- job_interview/면접/취업/面接 → "自己紹介をお願いします", "なぜ当社を志望されましたか？", "質問はございますか？"
- roommate/룸메이트/생활/ルームメイト → "今日はどうでしたか？", "一緒に料理しませんか？", "お疲れ様でした"
- hobby/취미/동호회/趣味 → "趣味は何ですか？", "一緒にやりませんか？", "いつ始めましたか？"
- presentation/발표/프레젠테이션/発表 → "今日は発表の練習をしましょう", "準備はできていますか？", "質問に答えてみてください"

💼 BUSINESS SCENARIOS:
- email/이메일/업무/メール → "お疲れ様です", "メールを確認しました", "返信いたします"
- meeting/회의/미팅/会議 → "会議を始めさせていただきます", "今日の議題は...", "ご質問はございますか？"
- deadline/마감/데드라인/締切 → "締切はいつでしょうか？", "進捗状況を教えてください", "時間が足りません"
- negotiation/협상/교섭/交渉 → "条件について話し合いましょう", "予算はどのくらいですか？", "ご検討いただけますか？"
- client_call/고객통화/クライアント → "いつもお世話になっております", "ご相談があります", "お忙しい中ありがとうございます"
- annual_review/인사평가/年次評価 → "今年の目標について話しましょう", "成果はいかがでしたか？", "来年の計画は..."

🚨 CRITICAL MATCHING ALGORITHM:
1. Scan scenario text for keywords (Japanese, Korean, English)
2. Match to appropriate category and generate context-specific dialogue
3. If no exact match: analyze topic and create relevant opening lines
4. NEVER use generic "what should we talk about" responses

ABSOLUTE PROHIBITION: "今日は何を話しましょう", "どんなことを話したい", "何について話しますか"`;

    userPrompt = `DYNAMIC SCENARIO ANALYSIS: "${scenarioText}"

🔍 ANALYSIS REQUIRED:
1. Scan for keywords: cafeteria, meeting, travel, homework, deadline, etc.
2. Identify context category (student/general/business)
3. Generate 3 opening lines that IMMEDIATELY match this specific scenario

⚡ INSTANT CONTEXT MATCHING:
- Restaurant/Food context → Start with ordering/menu discussion
- Meeting context → Start with meeting agenda/business topics
- School context → Start with lessons/homework/activities
- Travel context → Start with directions/booking/destinations
- Deadline context → Start with time pressure/progress
- Any other context → Analyze and match appropriately

📋 REQUIREMENTS:
Language level: ${config.level}
Teaching style: ${character.style}
Format: JSON with 3 "lines" and 3 "focus_phrases"

🚫 ABSOLUTELY FORBIDDEN:
"今日は何を話しましょう", "どんなことを話したい", "何について話しますか", or ANY generic conversation starters.

✅ REQUIRED OUTPUT:
Scenario-specific Japanese dialogue that demonstrates immediate understanding of the context.`;
  }

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
