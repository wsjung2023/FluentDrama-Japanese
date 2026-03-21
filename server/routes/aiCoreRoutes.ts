// Core AI conversation routes (dialogue, tts, and conversation response) with usage-limit checks.
import type { Express } from "express";
import { z } from "zod";
import {
  DEFAULT_DIFFICULTY_LEVEL,
  DEFAULT_LANGUAGE_CODE,
  DEFAULT_SUPPORT_LANGUAGE,
  difficultyFrameworkSchema,
  languageCodeSchema,
  type LanguageCode,
} from '@shared/language';
import {
  conversationResumeRequestSchema,
  conversationStartRequestSchema,
  conversationTurnRequestSchema,
} from "@shared/schema";
import { storage, type ConversationHistoryItem } from "../storage";
import { requireAuthenticated } from "./middleware/authGuard";
import { checkConversationUsageLimit } from "./helpers/aiUsage";
import { parseOrThrow } from "../lib/validate";
import { getErrorMessage, getErrorStatus } from "../lib/apiError";
import { logError } from "../lib/logger";
import { getPhase2LanguagePack, getSupportLanguageDescriptor } from "../services/phase2LanguagePack";

const dialogueCharacterSchema = z.object({
  name: z.string().min(1),
  gender: z.enum(['male', 'female']),
  style: z.enum(['cheerful', 'calm', 'strict']),
});

const dialogueScenarioSchema = z
  .object({
    presetKey: z.string().optional(),
    freeText: z.string().optional(),
  })
  .refine((data) => data.presetKey || data.freeText, {
    message: 'Either preset or custom scenario is required',
  });

const ttsCharacterSchema = z.object({
  gender: z.enum(['male', 'female']).optional(),
  style: z.enum(['cheerful', 'calm', 'strict']).optional(),
});

const conversationSpeakerSchema = z.enum(['user', 'assistant', 'character']);

const MAX_PROMPT_HISTORY_ITEMS = 24;
const MAX_SESSION_HISTORY_ITEMS = 120;


const TTS_LANGUAGE_DETECTION_ORDER = ['ko', 'ja', 'zh', 'ar', 'th', 'vi', 'fr', 'es', 'de', 'en'] as const;

type TtsDetectableLanguage = (typeof TTS_LANGUAGE_DETECTION_ORDER)[number];

function detectTtsLanguage(text: string, preferredLanguage?: LanguageCode): TtsDetectableLanguage {
  const ordered = preferredLanguage
    ? [preferredLanguage, ...TTS_LANGUAGE_DETECTION_ORDER.filter((language) => language !== preferredLanguage)]
    : [...TTS_LANGUAGE_DETECTION_ORDER];

  for (const language of ordered) {
    if (getPhase2LanguagePack(language).regex.test(text)) {
      return language as TtsDetectableLanguage;
    }
  }

  return (preferredLanguage as TtsDetectableLanguage | undefined) ?? 'en';
}

function applyTemplate(template: string, context: Record<string, string>) {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key: string) => context[key] ?? '');
}


function computeDeterministicFeedback(
  userInput: string,
  targetLanguage = DEFAULT_LANGUAGE_CODE,
  supportLanguage = DEFAULT_SUPPORT_LANGUAGE,
) {
  const pack = getPhase2LanguagePack(targetLanguage);
  const copy = pack.getFeedback(supportLanguage);
  const normalized = userInput.trim();
  if (!normalized) {
    return {
      accuracy: 0,
      suggestions: [copy.emptySuggestion],
      pronunciation: copy.emptyPronunciation,
      naturalness: 0,
      correction: null,
      betterExpression: null,
      explanation: copy.emptyExplanation,
      koreanExplanation: copy.emptyExplanation,
    };
  }

  const hasTargetLanguageText = pack.regex.test(normalized);
  const tokenCount = normalized.split(/\s+/).filter(Boolean).length;
  const baseScore = hasTargetLanguageText ? 65 : 35;
  const lengthBonus = Math.min(25, tokenCount * 4);
  const punctuationBonus = /[。？！!?.]/.test(normalized) ? 5 : 0;
  const accuracy = Math.min(95, baseScore + lengthBonus + punctuationBonus);

  return {
    accuracy,
    suggestions: [hasTargetLanguageText ? copy.successSuggestion : copy.retrySuggestion],
    pronunciation: hasTargetLanguageText ? copy.successPronunciation : copy.retryPronunciation,
    naturalness: hasTargetLanguageText ? Math.min(95, accuracy - 2) : 30,
    correction: hasTargetLanguageText ? null : copy.retryCorrection,
    betterExpression: hasTargetLanguageText ? null : copy.retryBetterExpression,
    explanation: hasTargetLanguageText ? copy.successExplanation : copy.retryExplanation,
    koreanExplanation: hasTargetLanguageText ? copy.successExplanation : copy.retryExplanation,
  };
}

const conversationCharacterSchema = z.object({
  name: z.string().trim().min(1),
  style: z.enum(['cheerful', 'calm', 'strict']),
});

export function registerAiCoreRoutes(app: Express) {
  app.post('/api/generate-dialogue', async (req: any, res) => {
    if (!requireAuthenticated(req, res)) {
      return;
    }

    try {
      const dialogueSchema = z.object({
        character: dialogueCharacterSchema,
        scenario: dialogueScenarioSchema,
        audience: z.enum(['student', 'general', 'business']).optional(),
        targetLanguage: languageCodeSchema.optional(),
        supportLanguage: languageCodeSchema.optional(),
        difficultyFramework: difficultyFrameworkSchema.optional(),
        difficultyLevel: z.string().optional(),
      });
      const { character, scenario, audience, targetLanguage, supportLanguage, difficultyFramework, difficultyLevel } = parseOrThrow(dialogueSchema, req.body);
      const userId = req.user.id;

      const usageCheck = await checkConversationUsageLimit(userId);
      if (!usageCheck.canUse) {
        return res.status(429).json({
          message: "사용 한도에 도달했습니다. 구독을 업그레이드해주세요.",
          currentUsage: usageCheck.currentUsage,
          limit: usageCheck.limit,
        });
      }

      const { generateDialogue } = await import('../services/openai');
      const dialogueResult = await generateDialogue({
        audience: audience || 'general',
        targetLanguage: targetLanguage || DEFAULT_LANGUAGE_CODE,
        supportLanguage: supportLanguage || DEFAULT_SUPPORT_LANGUAGE,
        difficultyFramework: difficultyFramework || 'jlpt',
        difficultyLevel: difficultyLevel || DEFAULT_DIFFICULTY_LEVEL,
        character,
        scenario,
      });

      await storage.incrementUsage(userId, 'conversation');

      res.json({
        lines: dialogueResult.lines,
        focus_phrases: dialogueResult.focus_phrases,
        character: character.name,
        message: getPhase2LanguagePack(targetLanguage || DEFAULT_LANGUAGE_CODE).dialogueCreatedMessage,
      });
    } catch (error) {
      logError('Dialogue generation error', error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, '대화 생성 중 오류가 발생했습니다.');
      res.status(status).json({
        message,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.post('/api/tts', async (req: any, res) => {
    if (!requireAuthenticated(req, res)) {
      return;
    }

    try {
      const ttsSchema = z.object({
        text: z.string().min(1, 'Text is required'),
        character: ttsCharacterSchema.optional(),
        targetLanguage: languageCodeSchema.optional(),
      });
      const { text, character, targetLanguage } = parseOrThrow(ttsSchema, req.body);
      const userId = req.user.id;

      const usageCheck = await checkConversationUsageLimit(userId);
      if (!usageCheck.canUse) {
        return res.status(429).json({
          message: "사용 한도에 도달했습니다. 구독을 업그레이드해주세요.",
          currentUsage: usageCheck.currentUsage,
          limit: usageCheck.limit,
        });
      }

      const detectedLanguage = detectTtsLanguage(text, targetLanguage);
      const useSlowLanguageVoice = detectedLanguage === 'ja' || detectedLanguage === 'ko';

      if (useSlowLanguageVoice) {
        let languageVoice;
        if (detectedLanguage === 'ko') {
          languageVoice = character?.gender === 'female' ? 'nova' : 'onyx';
        } else if (character?.gender === 'female') {
          languageVoice = 'nova';
        } else {
          languageVoice = 'onyx';
        }

        const openaiResponse = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1-hd',
            input: text,
            voice: languageVoice,
            response_format: 'mp3',
            speed: 0.8,
          }),
        });

        if (!openaiResponse.ok) {
          throw new Error(`OpenAI TTS API error: ${openaiResponse.status}`);
        }

        const audioBuffer = await openaiResponse.arrayBuffer();
        const audioBase64 = Buffer.from(audioBuffer).toString('base64');
        await storage.incrementUsage(userId, 'tts');

        return res.json({
          audioUrl: `data:audio/mp3;base64,${audioBase64}`,
          message: getPhase2LanguagePack(detectedLanguage).ttsMessage,
        });
      }

      const { getOpenAIVoiceForCharacter } = await import('../services/openai-tts');
      const voice = getOpenAIVoiceForCharacter(character?.style || 'cheerful', character?.gender || 'female');

      const openaiResponse = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1-hd',
          input: text,
          voice,
          response_format: 'mp3',
          speed: 0.9,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI TTS API error: ${openaiResponse.status}`);
      }

      const audioBuffer = await openaiResponse.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');
      await storage.incrementUsage(userId, 'tts');

      res.json({
        audioUrl: `data:audio/mp3;base64,${audioBase64}`,
        message: getPhase2LanguagePack(detectedLanguage).ttsMessage,
      });
    } catch (error) {
      logError('TTS generation error', error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, '음성 생성 중 오류가 발생했습니다.');
      res.status(status).json({
        message,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });


  app.post('/api/conversation/start', async (req: any, res) => {
    if (!requireAuthenticated(req, res)) {
      return;
    }

    try {
      const { scenarioId, difficulty, characterId, userGoal, targetLanguage } = parseOrThrow(conversationStartRequestSchema.extend({ targetLanguage: languageCodeSchema.optional() }), req.body);
      const userId = req.user.id;

      const usageCheck = await checkConversationUsageLimit(userId);
      if (!usageCheck.canUse) {
        return res.status(429).json({
          message: '사용 한도에 도달했습니다. 구독을 업그레이드해주세요.',
          currentUsage: usageCheck.currentUsage,
          limit: usageCheck.limit,
        });
      }

      const session = await storage.createConversationSession({
        userId,
        scenarioId,
        difficulty,
        characterId,
        userGoal,
      });

      const initialPromptTemplate = await storage.getPromptTemplate('conversation_initial_prompt', scenarioId, difficulty);
      const phase2Pack = getPhase2LanguagePack(targetLanguage || DEFAULT_LANGUAGE_CODE);
      const initialPrompt = initialPromptTemplate
        ? applyTemplate(initialPromptTemplate.content, { scenarioId, difficulty, characterId, userGoal })
        : phase2Pack.initialPrompt(scenarioId, userGoal);

      res.json({
        sessionId: session.sessionId,
        initialPrompt,
        scenario: {
          title: scenarioId,
          context: `${difficulty} 난이도 · 캐릭터 ${characterId}`,
        },
        message: '세션이 시작되었습니다',
      });
    } catch (error) {
      logError('Conversation start error', error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, '세션 시작 중 오류가 발생했습니다.');
      res.status(status).json({
        message,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.post('/api/conversation/turn', async (req: any, res) => {
    if (!requireAuthenticated(req, res)) {
      return;
    }

    try {
      const parsedTurn = parseOrThrow(conversationTurnRequestSchema.extend({ targetLanguage: languageCodeSchema.optional(), supportLanguage: languageCodeSchema.optional() }), req.body);
      const { sessionId, userInput, targetLanguage, supportLanguage } = parsedTurn;
      const history = parsedTurn.history ?? [];
      const userId = req.user.id;

      const session = await storage.getConversationSession(sessionId, userId);
      if (!session) {
        return res.status(404).json({
          message: '세션을 찾을 수 없습니다.',
        });
      }

      const usageCheck = await checkConversationUsageLimit(userId);
      if (!usageCheck.canUse) {
        return res.status(429).json({
          message: '사용 한도에 도달했습니다. 구독을 업그레이드해주세요.',
          currentUsage: usageCheck.currentUsage,
          limit: usageCheck.limit,
        });
      }

      const persistedHistory = await storage.getConversationMessages(sessionId, userId);
      const baseHistory = persistedHistory.length > 0
        ? persistedHistory
        : session.history;
      const runtimePolicy = await storage.getMasterConfig('conversation.runtime.policy');
      const configuredPromptLimit = Number(runtimePolicy?.configValue?.maxPromptHistoryItems);
      const promptHistoryLimit = Number.isInteger(configuredPromptLimit) && configuredPromptLimit > 0
        ? configuredPromptLimit
        : MAX_PROMPT_HISTORY_ITEMS;
      const promptHistorySource = history.length > 0
        ? history
        : baseHistory.map(({ speaker, text }) => ({ speaker, text }));
      const promptHistory = promptHistorySource.slice(-promptHistoryLimit);
      const phase2Pack = getPhase2LanguagePack(targetLanguage || DEFAULT_LANGUAGE_CODE);
      const systemTemplate = await storage.getPromptTemplate('conversation_system', session.scenarioId, session.difficulty);
      const systemPrompt = systemTemplate
        ? applyTemplate(systemTemplate.content, {
            scenarioId: session.scenarioId,
            difficulty: session.difficulty,
            characterId: session.characterId,
            userGoal: session.userGoal,
          })
        : phase2Pack.systemPrompt(session.scenarioId, session.difficulty, session.userGoal);

      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        {
          role: 'system',
          content: systemPrompt,
        },
      ];

      promptHistory.forEach((item) => {
        const role = item.speaker === 'user' ? 'user' : 'assistant';
        messages.push({ role, content: item.text });
      });
      const effectiveSupportLanguage = supportLanguage || DEFAULT_SUPPORT_LANGUAGE;
      const supportLanguageDescriptor = getSupportLanguageDescriptor(effectiveSupportLanguage);
      const turnPrompt = phase2Pack.buildConversationPrompt({
        characterName: session.characterId,
        topic: session.scenarioId,
        userInput,
        historyText: promptHistory.map((item) => `${item.speaker}: ${item.text}`).join('\n'),
        shouldConsiderEnding: promptHistory.length >= 10,
        supportLanguage: effectiveSupportLanguage,
      });
      messages.push({ role: 'user', content: turnPrompt });

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages,
          max_tokens: 220,
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const dialogueData = await openaiResponse.json();
      const rawContent = dialogueData.choices?.[0]?.message?.content?.trim();
      if (!rawContent) {
        throw new Error('대화 응답 생성에 실패했습니다.');
      }

      const parsedContent = JSON.parse(rawContent);
      const response = typeof parsedContent.response === 'string' && parsedContent.response.trim()
        ? parsedContent.response.trim()
        : phase2Pack.fallbackResponse;

      const feedback = computeDeterministicFeedback(
        userInput,
        targetLanguage || DEFAULT_LANGUAGE_CODE,
        effectiveSupportLanguage,
      );
      const pronunciationGuide = typeof parsedContent.pronunciationGuide === 'string' && parsedContent.pronunciationGuide.trim()
        ? parsedContent.pronunciationGuide.trim()
        : phase2Pack.buildPronunciationGuide(response);
      const supportText = effectiveSupportLanguage !== (targetLanguage || DEFAULT_LANGUAGE_CODE) && typeof parsedContent.supportTranslation === 'string' && parsedContent.supportTranslation.trim()
        ? parsedContent.supportTranslation.trim()
        : null;
      const modelFeedback = typeof parsedContent.feedback === 'object' && parsedContent.feedback !== null
        ? parsedContent.feedback as Record<string, unknown>
        : null;
      const explanation = typeof modelFeedback?.explanation === 'string' && modelFeedback.explanation.trim()
        ? modelFeedback.explanation.trim()
        : typeof modelFeedback?.koreanExplanation === 'string' && modelFeedback.koreanExplanation.trim()
          ? modelFeedback.koreanExplanation.trim()
          : feedback.explanation;
      const correction = typeof modelFeedback?.correction === 'string' && modelFeedback.correction.trim()
        ? modelFeedback.correction.trim()
        : feedback.correction;
      const betterExpression = typeof modelFeedback?.betterExpression === 'string' && modelFeedback.betterExpression.trim()
        ? modelFeedback.betterExpression.trim()
        : feedback.betterExpression;
      const suggestions = Array.isArray(modelFeedback?.suggestions)
        ? modelFeedback.suggestions.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
        : feedback.suggestions;
      const mergedFeedback = {
        ...feedback,
        explanation,
        koreanExplanation: explanation,
        correction,
        betterExpression,
        suggestions,
      };

      const now = Date.now();
      const mergedHistorySource: ConversationHistoryItem[] = [
        ...baseHistory,
        { speaker: 'user', text: userInput, timestamp: now },
        { speaker: 'assistant', text: response, timestamp: now },
      ];
      const mergedHistory = mergedHistorySource.slice(-MAX_SESSION_HISTORY_ITEMS);

      await storage.saveConversationTurn(sessionId, userId, mergedHistory, mergedFeedback);
      await storage.incrementUsage(userId, 'conversation');

      res.json({
        response,
        feedback: {
          ...mergedFeedback,
          explanationLabel: supportLanguageDescriptor.explanationLabel,
        },
        subtitle: {
          support: supportText,
          pronunciation: pronunciationGuide,
        },
        message: '대화 턴이 처리되었습니다',
      });
    } catch (error) {
      logError('Conversation turn error', error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, '대화 턴 처리 중 오류가 발생했습니다.');
      res.status(status).json({
        message,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.post('/api/conversation/resume', async (req: any, res) => {
    if (!requireAuthenticated(req, res)) {
      return;
    }

    try {
      const { sessionId } = parseOrThrow(conversationResumeRequestSchema, req.body);
      const userId = req.user.id;

      const session = await storage.getConversationSession(sessionId, userId);
      if (!session) {
        return res.status(404).json({
          message: '세션을 찾을 수 없습니다.',
        });
      }

      const persistedHistory = await storage.getConversationMessages(sessionId, userId);
      const resumeHistory = persistedHistory.length > 0 ? persistedHistory : session.history;
      const restoredFrom = persistedHistory.length > 0 ? 'messages' : 'session';
      const restoredAt = Date.now();

      res.json({
        sessionId,
        scenarioId: session.scenarioId,
        difficulty: session.difficulty,
        characterId: session.characterId,
        userGoal: session.userGoal,
        history: resumeHistory,
        historyCount: resumeHistory.length,
        restoredFrom,
        restoredAt,
        lastFeedback: session.lastFeedback,
        message: '세션이 복원되었습니다',
      });
    } catch (error) {
      logError('Conversation resume error', error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, '세션 복원 중 오류가 발생했습니다.');
      res.status(status).json({
        message,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.post('/api/conversation-response', async (req: any, res) => {
    if (!requireAuthenticated(req, res)) {
      return;
    }

    try {
      res.setHeader('Deprecation', 'true');
      res.setHeader('Sunset', '2026-12-31');

      const conversationSchema = z.object({
        userInput: z.string().trim().min(1),
        conversationHistory: z.array(z.object({
          speaker: conversationSpeakerSchema,
          text: z.string().trim().min(1),
        })).default([]),
        character: conversationCharacterSchema,
        topic: z.string().trim().optional(),
      });
      const parsedConversation = parseOrThrow(conversationSchema, req.body);
      const { userInput, character } = parsedConversation;
      const conversationHistory = parsedConversation.conversationHistory ?? [];
      const userId = req.user.id;

      const usageCheck = await checkConversationUsageLimit(userId);
      if (!usageCheck.canUse) {
        return res.status(429).json({
          message: '사용 한도에 도달했습니다. 구독을 업그레이드해주세요.',
          currentUsage: usageCheck.currentUsage,
          limit: usageCheck.limit,
        });
      }

      const messages: Array<{ role: string; content: string }> = [
        {
          role: 'system',
          content: `You are ${character.name}, a ${character.style} Japanese tutor. You are helping students practice Japanese conversation.\nRespond only in natural Japanese.`,
        },
      ];

      conversationHistory.forEach((msg) => {
        messages.push({ role: msg.speaker === 'user' ? 'user' : 'assistant', content: msg.text });
      });
      messages.push({ role: 'user', content: userInput });

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'gpt-4o', messages, max_tokens: 150, temperature: 0.8 }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const dialogueData = await openaiResponse.json();
      const response = dialogueData.choices[0].message.content;

      await storage.incrementUsage(userId, 'conversation');

      res.json({
        response,
        feedback: computeDeterministicFeedback(userInput),
        message: '대화가 생성되었습니다!',
      });
    } catch (error) {
      logError('Conversation response error', error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, '대화 생성 중 오류가 발생했습니다.');
      res.status(status).json({
        message,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
