import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated, isAdmin, setupAuth, hashPassword } from "./auth";
import passport from "passport";
import { recognizeSpeech } from "./services/speech-recognition";

// Middleware to ensure API responses are always JSON
function ensureJsonResponse(req: any, res: any, next: any) {
  if (req.path && req.path.startsWith('/api')) {
    res.setHeader('Content-Type', 'application/json');
    
    // Override res.send to ensure JSON format
    const originalSend = res.send;
    res.send = function(data: any) {
      if (typeof data === 'string' && !data.startsWith('{') && !data.startsWith('[')) {
        // Convert string to JSON object
        return originalSend.call(this, JSON.stringify({ message: data }));
      }
      return originalSend.call(this, data);
    };
  }
  next();
}

// Pricing helper function
function getTierPrice(tier: string): number {
  switch (tier) {
    case 'starter': return 4900; // ₩4,900
    case 'pro': return 9900; // ₩9,900
    case 'premium': return 19900; // ₩19,900
    default: return 0;
  }
}

// Paddle Price ID mapping - FluentDrama 실제 Price ID
function getPaddlePriceId(tier: string): string {
  switch (tier) {
    case 'starter': return 'pri_01k3xqqv4bp4xdjxn2b0p0f0n4'; // Starter Plan
    case 'pro': return 'pri_01k3xqt841ry893jwdbjybyp2q'; // Pro Plan
    case 'premium': return 'pri_01k3xqw6mges1rt7kmkv57xpb0'; // Premium Plan
    default: throw new Error(`Invalid tier: ${tier}`);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);
  
  // Apply JSON response middleware to all API routes
  app.use('/api', ensureJsonResponse);

  // Google OAuth routes handled in auth.ts - removed duplication

  // Authentication endpoints
  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "사용자가 이미 존재합니다" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        subscriptionTier: 'free',
        subscriptionStatus: 'active'
      });

      req.login(user, (err: any) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "등록 실패" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res) => {
    // Clear session
    (req.session as any).userId = null;
    req.logout((err: any) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.session as any)?.userId || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Payment routes for Korean providers
  // Usage limit checking endpoint
  app.post('/api/check-usage', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if daily usage needs reset (monthly for free tier)
      const now = new Date();
      const lastReset = user.lastUsageReset ? new Date(user.lastUsageReset) : new Date();
      const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
      
      let currentUsage = parseInt(user.dailyUsageCount || "0");
      
      // Reset usage if 30 days have passed (monthly reset for free tier)
      if (daysSinceReset >= 30) {
        currentUsage = 0;
        await storage.updateUserSubscription(userId, {
          dailyUsageCount: "0",
          lastUsageReset: now
        });
      }
      
      // Define usage limits by tier
      const limits = {
        free: { conversations: 30, images: 1 },
        starter: { conversations: 300, images: 15 },
        pro: { conversations: 600, images: 25 },
        premium: { conversations: 1200, images: 60 }
      };
      
      const userLimit = limits[user.subscriptionTier as keyof typeof limits] || limits.free;
      const canUse = currentUsage < userLimit.conversations;
      
      res.json({
        canUse,
        currentUsage,
        limit: userLimit.conversations,
        tier: user.subscriptionTier,
        daysUntilReset: 30 - daysSinceReset
      });
      
    } catch (error) {
      console.error("Usage check error:", error);
      res.status(500).json({ message: "Failed to check usage" });
    }
  });
  
  // Increment usage counter
  app.post('/api/increment-usage', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const newUsage = parseInt(user.dailyUsageCount || "0") + 1;
      
      await storage.updateUserSubscription(userId, {
        dailyUsageCount: newUsage.toString()
      });
      
      res.json({ success: true, newUsage });
      
    } catch (error) {
      console.error("Usage increment error:", error);
      res.status(500).json({ message: "Failed to increment usage" });
    }
  });

  // Paddle payment integration only
  app.post('/api/subscribe', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { tier, provider } = req.body;
      const userId = req.user.id;
      
      if (provider === 'paddle') {
        try {
          if (!process.env.PADDLE_API_KEY) {
            return res.status(400).json({ 
              message: "Paddle API 키가 설정되지 않았습니다." 
            });
          }

          // Paddle 실제 API 호출
          const paddlePayment = await fetch('https://api.paddle.com/transactions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
              'Paddle-Version': '1',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              items: [{
                price_id: getPaddlePriceId(tier),
                quantity: 1
              }],
              collection_mode: 'automatic',
              custom_data: {
                user_id: userId,
                tier: tier
              }
            })
          });

          const paddleData = await paddlePayment.json();
          
          if (paddlePayment.ok) {
            const user = await storage.updateUserSubscription(userId, {
              subscriptionTier: tier,
              paymentProvider: provider,
              subscriptionStatus: 'active',
              customerId: paddleData.customer_id || userId,
              subscriptionId: paddleData.id || `paddle_${Date.now()}`,
              subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });
            
            res.json({ success: true, user, paymentData: paddleData });
          } else {
            res.status(400).json({ message: "Paddle 결제 실패", error: paddleData });
          }
        } catch (paddleError) {
          console.error("Paddle request error:", paddleError);
          res.status(500).json({ message: "Paddle 결제 처리 중 오류가 발생했습니다." });
        }

      } else {
        res.status(400).json({ message: "현재 Paddle 결제만 지원합니다." });
      }
      
    } catch (error) {
      console.error("Subscription error:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.post('/api/cancel-subscription', (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user.id;
      
      const user = storage.updateUserSubscription(userId, {
        subscriptionTier: 'free',
        subscriptionStatus: 'cancelled'
      });
      
      res.json({ success: true, user });
    } catch (error) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // Admin endpoints
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/user/:email", isAdmin, async (req, res) => {
    try {
      const { email } = req.params;
      const user = await storage.getUserByEmail(decodeURIComponent(email));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/admin/user/:id/subscription", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { tier } = req.body;
      
      const user = await storage.updateUserSubscription(id, {
        subscriptionTier: tier,
        subscriptionStatus: tier === 'free' ? 'inactive' : 'active',
        paymentProvider: tier === 'free' ? null : 'admin',
        customerId: tier === 'free' ? null : `admin_${id}`,
        subscriptionId: tier === 'free' ? null : `admin_sub_${Date.now()}`,
        subscriptionExpiresAt: tier === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      
      res.json(user);
    } catch (error) {
      console.error("Update subscription error:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  app.put("/api/admin/user/:id/reset-usage", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await storage.resetUserUsage(id);
      
      res.json(user);
    } catch (error) {
      console.error("Reset usage error:", error);
      res.status(500).json({ message: "Failed to reset usage" });
    }
  });

  // AI Learning API Endpoints
  app.post('/api/generate-image', async (req: any, res) => {
    console.log('[Image API] Request received:', { 
      authenticated: req.isAuthenticated?.(),
      body: { name: req.body?.name, gender: req.body?.gender, style: req.body?.style }
    });
    
    if (!req.isAuthenticated()) {
      console.log('[Image API] Unauthorized request');
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { name, gender, style, audience, scenario, customScenarioText, backgroundPrompt } = req.body;
      const userId = req.user.id;
      console.log('[Image API] Starting image generation for user:', userId);

      // Check image generation limits specifically
      const imageUsageCheck = await checkImageUsageLimit(userId);
      if (!imageUsageCheck.canUse) {
        return res.status(429).json({ 
          message: "이미지 생성 한도에 도달했습니다. 기존 캐릭터를 재사용하거나 구독을 업그레이드해주세요.",
          currentUsage: imageUsageCheck.currentUsage,
          limit: imageUsageCheck.limit,
          type: "image_limit_exceeded"
        });
      }

      // Define scenario-specific backgrounds
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
          library: "quiet library with bookshelves and study areas"
        };
        return backgrounds[scenario as keyof typeof backgrounds] || "professional indoor setting";
      };

      // Define style characteristics
      const styleMap = {
        cheerful: "bright smile, friendly expression, energetic pose",
        calm: "serene expression, gentle demeanor, relaxed posture", 
        strict: "serious expression, professional appearance, confident stance"
      };

      // Get scenario-specific background - AI 생성 프롬프트 우선 사용
      let background;
      if (backgroundPrompt && backgroundPrompt.backgroundSetting) {
        // AI 생성 배경 프롬프트 사용
        background = backgroundPrompt.backgroundSetting;
      } else if (customScenarioText && customScenarioText.trim()) {
        // 커스텀 시나리오: 사용자 입력 텍스트에서 배경 추출
        background = `realistic setting based on: ${customScenarioText.trim()}`;
      } else {
        // 프리셋 시나리오: 하드코딩된 배경 사용  
        background = scenario ? getScenarioBackground(scenario) : `professional setting suitable for ${audience} level Japanese learning`;
      }
      
      // Get appropriate outfit and pose based on scenario and style
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
          library: 'librarian or academic professional attire'
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

      // AI 생성 프롬프트 우선 사용하여 복장과 포즈 결정
      let outfit, pose;
      if (backgroundPrompt) {
        // AI 생성 복장과 포즈 사용
        outfit = backgroundPrompt.appropriateOutfit || getOutfitForScenario(scenario || 'restaurant', style);
        pose = backgroundPrompt.characterPose || getPoseForStyle(style);
      } else if (customScenarioText && customScenarioText.trim()) {
        // 커스텀 시나리오: 상황에 맞는 자연스러운 복장
        outfit = `appropriate attire for the situation: ${customScenarioText.trim()}`;
        pose = getPoseForStyle(style);
      } else {
        // 프리셋 시나리오: 하드코딩된 복장 사용
        outfit = getOutfitForScenario(scenario || 'restaurant', style);
        pose = getPoseForStyle(style);
      }
      const styleCharacteristics = styleMap[style as keyof typeof styleMap] || "friendly expression";

      // Create comprehensive prompt with scenario context following user requirements
      const comprehensivePrompt = `FULL LENGTH BODY SHOT: Professional photograph of a real human ${gender} person of Japanese/East Asian ethnicity, ENTIRE BODY visible from head to feet, standing ${pose}, wearing ${outfit}, at ${background}. 

MANDATORY FRAMING: Complete figure visible - head at top 20% of image, feet at bottom 10% of image, showing shoes/footwear. Person should occupy 60-70% of image height to ensure full body is captured without cropping any limbs.

CAMERA SETUP: Positioned 8-10 feet back from subject, wide angle lens (24-35mm equivalent), vertical orientation, adequate space above head and below feet.

Ultra photorealistic, natural Asian skin texture, realistic human proportions, Japanese/East Asian facial features, professional portrait lighting.
High quality DSLR shot, f/2.8, soft natural light, balanced exposure.
ETHNICITY: Japanese or East Asian appearance, distinctive Asian facial features, appropriate hair color and style.

STRICTLY NO: head-and-shoulders only, waist-up shots, cropped legs, cropped feet, tight framing that cuts off any body parts, illustration, no anime, no 3D render, no doll-like face, no over-smoothing, no plastic skin, no exaggerated eyes.`;

      // Generate character image using OpenAI DALL-E
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
          size: "1024x1792", // Maximum vertical ratio for full body shots
          quality: "hd", // High quality for realistic images
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const imageData = await openaiResponse.json();
      const imageUrl = imageData.data[0].url;

      // Increment usage
      await storage.incrementUsage(userId, 'imageGeneration');

      // Auto-save character for reuse
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
        // Don't fail the request if saving fails
      }

      res.json({ 
        imageUrl,
        character: { name, gender, style },
        message: "캐릭터 이미지가 생성되고 저장되었습니다!"
      });

    } catch (error) {
      console.error('Image generation error:', error);
      res.status(500).json({ 
        message: "이미지 생성 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/generate-dialogue', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { character, scenario, audience } = req.body;
      const userId = req.user.id;

      // Check usage limits
      const usageCheck = await checkUsageLimit(userId);
      if (!usageCheck.canUse) {
        return res.status(429).json({ 
          message: "사용 한도에 도달했습니다. 구독을 업그레이드해주세요.",
          currentUsage: usageCheck.currentUsage,
          limit: usageCheck.limit
        });
      }

      // Use existing dialogue generation service
      const { generateDialogue } = await import('./services/openai');
      const dialogueResult = await generateDialogue({
        audience: audience || 'general',
        character: character,
        scenario: scenario
      });

      // Increment usage
      await storage.incrementUsage(userId, 'conversation');

      res.json({ 
        lines: dialogueResult.lines,
        focus_phrases: dialogueResult.focus_phrases,
        character: character.name,
        message: "대화가 생성되었습니다!"
      });

    } catch (error) {
      console.error('Dialogue generation error:', error);
      res.status(500).json({ 
        message: "대화 생성 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/tts', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { text, character } = req.body;
      const userId = req.user.id;

      // Check usage limits
      const usageCheck = await checkUsageLimit(userId);
      if (!usageCheck.canUse) {
        return res.status(429).json({ 
          message: "사용 한도에 도달했습니다. 구독을 업그레이드해주세요.",
          currentUsage: usageCheck.currentUsage,
          limit: usageCheck.limit
        });
      }

      // Detect language and use appropriate TTS
      const isJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
      
      if (isJapanese) {
        // For Japanese text, use character-specific voice selection
        console.log('🎌 Japanese text detected, using character voice selection');
        console.log('🎭 Character info:', character);
        
        // Use the same voice selection logic as frontend
        let japaneseVoices;
        if (character?.gender === 'female') {
          if (character?.style === 'cheerful') {
            japaneseVoices = 'nova'; // bright & clear
          } else if (character?.style === 'calm') {
            japaneseVoices = 'nova'; // professional
          } else if (character?.style === 'strict') {
            japaneseVoices = 'nova'; // authoritative
          } else {
            japaneseVoices = 'nova'; // default female
          }
        } else {
          if (character?.style === 'cheerful') {
            japaneseVoices = 'onyx'; // deep & warm
          } else if (character?.style === 'calm') {
            japaneseVoices = 'onyx'; // calm & deep
          } else if (character?.style === 'strict') {
            japaneseVoices = 'onyx'; // authoritative
          } else {
            japaneseVoices = 'onyx'; // default male
          }
        }
        
        console.log(`🎤 Selected Japanese voice: ${japaneseVoices} for ${character?.gender} ${character?.style}`);
        
        const openaiResponse = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "tts-1-hd",
            input: text,
            voice: japaneseVoices,
            response_format: "mp3",
            speed: 0.8  // Slower speed for better Japanese pronunciation
          }),
        });

        if (!openaiResponse.ok) {
          throw new Error(`OpenAI TTS API error: ${openaiResponse.status}`);
        }

        const audioBuffer = await openaiResponse.arrayBuffer();
        const audioBase64 = Buffer.from(audioBuffer).toString('base64');

        // Increment usage
        await storage.incrementUsage(userId, 'tts');

        return res.json({ 
          audioUrl: `data:audio/mp3;base64,${audioBase64}`,
          message: "日本語音声が生成されました！"
        });
      } else {
        // For English text, use original voice mapping
        const { getOpenAIVoiceForCharacter } = await import('./services/openai-tts');
        const voice = getOpenAIVoiceForCharacter(
          character?.style || 'cheerful', 
          character?.gender || 'female'
        );
        
        const openaiResponse = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "tts-1-hd",
            input: text,
            voice: voice,
            response_format: "mp3",
            speed: 0.9
          }),
        });

        if (!openaiResponse.ok) {
          throw new Error(`OpenAI TTS API error: ${openaiResponse.status}`);
        }

        const audioBuffer = await openaiResponse.arrayBuffer();
        const audioBase64 = Buffer.from(audioBuffer).toString('base64');

        // Increment usage
        await storage.incrementUsage(userId, 'tts');

        res.json({ 
          audioUrl: `data:audio/mp3;base64,${audioBase64}`,
          message: "음성이 생성되었습니다!"
        });
      }

    } catch (error) {
      console.error('TTS generation error:', error);
      res.status(500).json({ 
        message: "음성 생성 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Conversation response endpoint for voice chat
  app.post('/api/conversation-response', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { userInput, conversationHistory, character, topic } = req.body;
      const userId = req.user.id;

      // Check usage limits
      const usageCheck = await checkUsageLimit(userId);
      if (!usageCheck.canUse) {
        return res.status(429).json({ 
          message: "사용 한도에 도달했습니다. 구독을 업그레이드해주세요.",
          currentUsage: usageCheck.currentUsage,
          limit: usageCheck.limit
        });
      }

      // Build conversation messages
      const messages = [];
      
      // System prompt for Japanese tutor
      messages.push({
        role: "system",
        content: `You are ${character.name}, a ${character.style} Japanese tutor. You are helping students practice Japanese conversation.
        
CRITICAL INSTRUCTIONS:
- You must respond ONLY in Japanese
- Use natural, conversational Japanese appropriate for the student's level
- Be encouraging and helpful
- Provide gentle corrections when needed
- Keep responses natural and friendly

Respond naturally to the user's input in Japanese only.`
      });

      // Add conversation history
      conversationHistory.forEach((msg: any) => {
        messages.push({
          role: msg.speaker === 'user' ? 'user' : 'assistant',
          content: msg.text
        });
      });

      // Add current user input
      messages.push({
        role: "user",
        content: userInput
      });

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: messages,
          max_tokens: 150,
          temperature: 0.8,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const dialogueData = await openaiResponse.json();
      const response = dialogueData.choices[0].message.content;

      // Increment usage
      await storage.incrementUsage(userId, 'conversation');

      res.json({ 
        response,
        feedback: {
          accuracy: Math.floor(Math.random() * 20) + 80 // Mock accuracy for now
        },
        message: "대화가 생성되었습니다!"
      });

    } catch (error) {
      console.error('Conversation response error:', error);
      res.status(500).json({ 
        message: "대화 생성 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Background prompt generation for custom scenarios endpoint
  app.post('/api/generate-background-prompt', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { customScenarioText, characterStyle, characterGender } = req.body;
      
      if (!customScenarioText) {
        return res.status(400).json({ message: "Custom scenario text is required" });
      }

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `당신은 일본어 학습 앱의 캐릭터 이미지 생성을 위한 배경 프롬프트 전문가입니다. 
주어진 커스텀 시나리오를 분석하여 다음을 생성하세요:
1. 배경 환경 설명 (영어)
2. 상황에 맞는 복장/의상 설명 (영어)  
3. 캐릭터의 자세/포즈 제안 (영어)
4. 전체적인 분위기/조명 설명 (영어)

JSON 형식으로 응답하세요: {
  "backgroundSetting": "배경 환경",
  "appropriateOutfit": "적절한 복장",
  "characterPose": "캐릭터 포즈",
  "atmosphere": "분위기/조명",
  "combinedPrompt": "모든 요소를 결합한 완전한 프롬프트"
}`
            },
            {
              role: "user",
              content: `커스텀 시나리오: "${customScenarioText}"
캐릭터 스타일: ${characterStyle || 'cheerful'}
캐릭터 성별: ${characterGender || 'female'}

이 시나리오에 맞는 배경, 복장, 포즈, 분위기를 제안해주세요.`
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const result = await openaiResponse.json();
      const content = JSON.parse(result.choices[0].message.content);

      res.json({
        ...content,
        message: "배경 프롬프트가 생성되었습니다!"
      });

    } catch (error) {
      console.error('Background prompt generation error:', error);
      res.status(500).json({ 
        message: "배경 프롬프트 생성 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Translation and pronunciation generation endpoint
  app.post('/api/translate-pronunciation', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a Japanese language assistant. For Japanese text, provide Korean translation and romanized pronunciation. Respond in JSON format with 'koreanTranslation' and 'pronunciation' fields."
            },
            {
              role: "user",
              content: `Provide Korean translation and romanized pronunciation for this Japanese text: "${text}"`
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 300,
          temperature: 0.3,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const result = await openaiResponse.json();
      const rawContent = result.choices[0].message.content;
      const content = JSON.parse(rawContent);

      const response = {
        koreanTranslation: content.koreanTranslation || "",
        pronunciation: content.pronunciation || "",
        message: "번역 및 발음이 생성되었습니다!"
      };
      res.json(response);

    } catch (error) {
      console.error('Translation/pronunciation generation error:', error);
      res.status(500).json({ 
        message: "번역 및 발음 생성 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Speech Recognition API
  app.post('/api/speech-recognition', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { audioBlob, language } = req.body;
      
      if (!audioBlob) {
        return res.status(400).json({ message: "Audio data is required" });
      }

      // Call the speech recognition service
      const result = await recognizeSpeech({ audioBlob, language: language || 'ja' });
      
      res.json({
        text: result.text,
        confidence: result.confidence,
        message: "음성 인식이 완료되었습니다!"
      });

    } catch (error) {
      console.error('Speech recognition error:', error);
      res.status(500).json({ 
        message: "음성 인식 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Helper function for usage limit checking
  async function checkUsageLimit(userId: string) {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return { canUse: false, currentUsage: 0, limit: 0 };
      }

      // Admin bypass - mainstop3@gmail.com has unlimited usage
      if (user.email === 'mainstop3@gmail.com' || user.isAdmin === true) {
        return {
          canUse: true,
          currentUsage: 0,
          limit: 999999
        };
      }

      const tier = user.subscriptionTier || 'free';
      const limits = {
        'free': 30,
        'starter': 300,
        'pro': 1000,
        'premium': 5000
      };

      const limit = limits[tier as keyof typeof limits] || 30;
      const currentUsage = parseInt(user.conversationCount || '0');

      return {
        canUse: currentUsage < limit,
        currentUsage,
        limit
      };
    } catch (error) {
      console.error('Usage limit check error:', error);
      return { canUse: false, currentUsage: 0, limit: 0 };
    }
  }

  // Helper function for image generation limit checking  
  async function checkImageUsageLimit(userId: string) {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return { canUse: false, currentUsage: 0, limit: 0 };
      }

      // Admin bypass - mainstop3@gmail.com has unlimited usage
      if (user.email === 'mainstop3@gmail.com' || user.isAdmin === true) {
        return {
          canUse: true,
          currentUsage: 0,
          limit: 999999
        };
      }

      const tier = user.subscriptionTier || 'free';
      
      // Define image generation limits by tier (monthly)
      const imageLimits = {
        'free': 1,      // 무료: 1개/월만
        'starter': 15,  // 스타터: 15개/월
        'pro': 25,      // 프로: 25개/월  
        'premium': 60   // 프리미엄: 60개/월
      };

      const limit = imageLimits[tier as keyof typeof imageLimits] || 1;
      const currentUsage = parseInt(user.imageGenerationCount || '0');

      return {
        canUse: currentUsage < limit,
        currentUsage,
        limit
      };
    } catch (error) {
      console.error('Image usage limit check error:', error);
      return { canUse: false, currentUsage: 0, limit: 0 };
    }
  }

  // ====== SAVED CHARACTERS API ======

  // Get user's saved characters
  app.get('/api/saved-characters', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user.id;
      const characters = await storage.getUserCharacters(userId);
      res.json(characters);
    } catch (error) {
      console.error("Failed to get saved characters:", error);
      res.status(500).json({ message: "Failed to get saved characters" });
    }
  });

  // Save a character
  app.post('/api/saved-characters', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user.id;
      const { name, gender, style, imageUrl, audience, scenario, backgroundPrompt } = req.body;

      const characterData = {
        userId,
        name,
        gender,
        style,
        imageUrl,
        audience,
        scenario,
        backgroundPrompt,
      };

      const savedCharacter = await storage.saveCharacter(characterData);
      res.json(savedCharacter);
    } catch (error) {
      console.error("Failed to save character:", error);
      res.status(500).json({ message: "Failed to save character" });
    }
  });

  // Get specific character
  app.get('/api/saved-characters/:id', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user.id;
      const characterId = req.params.id;
      
      const character = await storage.getCharacter(characterId, userId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      // Update usage stats
      await storage.updateCharacterUsage(characterId);

      res.json(character);
    } catch (error) {
      console.error("Failed to get character:", error);
      res.status(500).json({ message: "Failed to get character" });
    }
  });

  // Delete character
  app.delete('/api/saved-characters/:id', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user.id;
      const characterId = req.params.id;
      
      const deleted = await storage.deleteCharacter(characterId, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Character not found" });
      }

      res.json({ message: "Character deleted successfully" });
    } catch (error) {
      console.error("Failed to delete character:", error);
      res.status(500).json({ message: "Failed to delete character" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}