// Core AI conversation routes (dialogue, tts, and conversation response) with usage-limit checks.
import type { Express } from "express";
import { z } from "zod";
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

const DEFAULT_SYSTEM_TEMPLATE = 'You are a Japanese tutor role-playing scenario {{scenarioId}}. Difficulty: {{difficulty}}. Goal: {{userGoal}}. Keep responses concise and natural Japanese.';
const DEFAULT_INITIAL_PROMPT_TEMPLATE = '{{scenarioId}} 상황에서 {{userGoal}} 목표를 연습해봅시다.';

function applyTemplate(template: string, context: Record<string, string>) {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key: string) => context[key] ?? '');
}


function computeDeterministicFeedback(userInput: string) {
  const normalized = userInput.trim();
  if (!normalized) {
    return {
      accuracy: 0,
      suggestions: ['짧은 일본어 문장부터 입력해보세요.'],
      pronunciation: '입력이 없어 발음 피드백을 제공하지 않았습니다.',
      naturalness: 0,
      correction: null,
      betterExpression: null,
      koreanExplanation: '입력이 비어 있어 기본 피드백만 제공합니다.',
    };
  }

  const hasJapanese = /[぀-ヿ㐀-龿]/.test(normalized);
  const tokenCount = normalized.split(/\s+/).filter(Boolean).length;
  const baseScore = hasJapanese ? 65 : 35;
  const lengthBonus = Math.min(25, tokenCount * 4);
  const punctuationBonus = /[。？！!?.]/.test(normalized) ? 5 : 0;
  const accuracy = Math.min(95, baseScore + lengthBonus + punctuationBonus);

  return {
    accuracy,
    suggestions: hasJapanese
      ? ['문장을 한 문장 더 이어서 말하면 자연스러움이 좋아집니다.']
      : ['일본어 문자를 포함해서 다시 말해보세요.'],
    pronunciation: hasJapanese
      ? '전반적으로 안정적입니다. 문장 끝 억양을 조금 더 부드럽게 해보세요.'
      : '일본어 발음 피드백을 위해 일본어 문장을 입력해주세요.',
    naturalness: hasJapanese ? Math.min(95, accuracy - 2) : 30,
    correction: hasJapanese ? null : '예: すみません、もう一度お願いします。',
    betterExpression: hasJapanese ? null : '短くても 일본어 표현을 넣어보세요.',
    koreanExplanation: hasJapanese
      ? '문장 길이와 문장부호를 기준으로 기본 평가를 제공했습니다.'
      : '일본어 문자가 없어 기초 점수로 평가했습니다.',
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
      });
      const { character, scenario, audience } = parseOrThrow(dialogueSchema, req.body);
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
        character,
        scenario,
      });

      await storage.incrementUsage(userId, 'conversation');

      res.json({
        lines: dialogueResult.lines,
        focus_phrases: dialogueResult.focus_phrases,
        character: character.name,
        message: "대화가 생성되었습니다!",
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
      });
      const { text, character } = parseOrThrow(ttsSchema, req.body);
      const userId = req.user.id;

      const usageCheck = await checkConversationUsageLimit(userId);
      if (!usageCheck.canUse) {
        return res.status(429).json({
          message: "사용 한도에 도달했습니다. 구독을 업그레이드해주세요.",
          currentUsage: usageCheck.currentUsage,
          limit: usageCheck.limit,
        });
      }

      const isJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);

      if (isJapanese) {
        let japaneseVoices;
        if (character?.gender === 'female') {
          japaneseVoices = 'nova';
        } else {
          japaneseVoices = 'onyx';
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
            voice: japaneseVoices,
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
          message: '日本語音声が生成されました！',
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
        message: '음성이 생성되었습니다!',
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
      const { scenarioId, difficulty, characterId, userGoal } = parseOrThrow(conversationStartRequestSchema, req.body);
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
      const initialPrompt = applyTemplate(initialPromptTemplate?.content ?? DEFAULT_INITIAL_PROMPT_TEMPLATE, {
        scenarioId,
        difficulty,
        characterId,
        userGoal,
      });

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
      const parsedTurn = parseOrThrow(conversationTurnRequestSchema, req.body);
      const { sessionId, userInput } = parsedTurn;
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
      const systemTemplate = await storage.getPromptTemplate('conversation_system', session.scenarioId, session.difficulty);
      const systemPrompt = applyTemplate(systemTemplate?.content ?? DEFAULT_SYSTEM_TEMPLATE, {
        scenarioId: session.scenarioId,
        difficulty: session.difficulty,
        characterId: session.characterId,
        userGoal: session.userGoal,
      });

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
      messages.push({ role: 'user', content: userInput });

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages,
          max_tokens: 180,
          temperature: 0.7,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const dialogueData = await openaiResponse.json();
      const response = dialogueData.choices?.[0]?.message?.content?.trim();
      if (!response) {
        throw new Error('대화 응답 생성에 실패했습니다.');
      }

      const feedback = computeDeterministicFeedback(userInput);

      const now = Date.now();
      const mergedHistorySource: ConversationHistoryItem[] = [
        ...baseHistory,
        { speaker: 'user', text: userInput, timestamp: now },
        { speaker: 'assistant', text: response, timestamp: now },
      ];
      const mergedHistory = mergedHistorySource.slice(-MAX_SESSION_HISTORY_ITEMS);

      await storage.saveConversationTurn(sessionId, userId, mergedHistory, feedback);
      await storage.incrementUsage(userId, 'conversation');

      res.json({
        response,
        feedback,
        subtitle: {
          ja: response,
          ko: '한국어 해석은 다음 스프린트에서 고도화됩니다.',
          yomigana: response,
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
