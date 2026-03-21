// Shared conversation session hook to unify start/turn/resume flows across pages.
import { useMemo, useRef, useState } from 'react';
import type { DifficultyFramework, LanguageCode } from '@shared/language';
import { apiRequest, safeJsonParse } from '@/lib/queryClient';
import { getConversationHookCopy } from '@/constants/uiCopy';
import { getLanguageDisplayName } from '@/constants/languages';

export interface Feedback {
  accuracy: number | null;
  naturalness?: number | null;
  correction?: string | null;
  betterExpression?: string | null;
  explanation?: string | null;
  koreanExplanation?: string | null;
  suggestions?: string[];
  explanationLabel?: string | null;
}

export interface SessionTurn {
  speaker: 'user' | 'assistant';
  text: string;
  audioUrl?: string;
  supportTranslation?: string;
  pronunciation?: string;
  feedback?: Feedback;
}

interface UseConversationSessionOptions {
  scenarioId: string;
  character: { name: string; gender: 'male' | 'female'; style: 'cheerful' | 'calm' | 'strict' };
  audience: 'student' | 'general' | 'business';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  targetLanguage?: LanguageCode;
  supportLanguage?: LanguageCode;
  uiLanguage?: LanguageCode;
  difficultyFramework?: DifficultyFramework;
  difficultyLevel?: string;
}

const AUDIENCE_LABELS = {
  ko: { student: '학생', general: '일상', business: '비즈니스' },
  en: { student: 'student', general: 'daily-life', business: 'business' },
  ja: { student: '学生', general: '日常', business: 'ビジネス' },
} as const;

function getAudienceLabel(uiLanguage: LanguageCode, audience: 'student' | 'general' | 'business') {
  const key = uiLanguage === 'ko' || uiLanguage === 'ja' ? uiLanguage : 'en';
  return AUDIENCE_LABELS[key][audience];
}

export function useConversationSession(options: UseConversationSessionOptions) {
  const copy = getConversationHookCopy(options.uiLanguage ?? 'en');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<SessionTurn[]>([]);
  const historyRef = useRef<SessionTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setHistorySafely = (nextHistory: SessionTurn[]) => {
    historyRef.current = nextHistory;
    setHistory(nextHistory);
  };

  const payloadBase = useMemo(
    () => ({
      scenarioId: options.scenarioId,
      difficulty: options.difficulty ?? 'beginner',
      characterId: options.character.name,
      userGoal: copy.userGoal(
        getAudienceLabel(options.uiLanguage ?? 'en', options.audience),
        getLanguageDisplayName(options.targetLanguage || 'ja'),
      ),
      targetLanguage: options.targetLanguage,
      supportLanguage: options.supportLanguage,
      uiLanguage: options.uiLanguage,
      difficultyFramework: options.difficultyFramework,
      difficultyLevel: options.difficultyLevel,
    }),
    [copy, options],
  );

  const startSession = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await safeJsonParse(await apiRequest('POST', '/api/conversation/start', payloadBase));
      const startData = response as { sessionId?: string; initialPrompt?: string };
      if (!startData.sessionId || !startData.initialPrompt) {
        throw new Error(copy.invalidStartResponse);
      }

      const openingMessage: SessionTurn = { speaker: 'assistant', text: startData.initialPrompt };
      setSessionId(startData.sessionId);
      setHistorySafely([openingMessage]);
      return { sessionId: startData.sessionId, openingMessage };
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : copy.defaultError;
      setError(message);
      throw caughtError;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTurn = async (userInput: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!sessionId) {
        throw new Error(copy.sessionNotInitialized);
      }

      const normalizedInput = userInput.trim();
      if (!normalizedInput) {
        throw new Error(copy.emptyInput);
      }

      const userTurn: SessionTurn = { speaker: 'user', text: normalizedInput };
      const nextHistory = [...historyRef.current, userTurn];
      const response = await safeJsonParse(
        await apiRequest('POST', '/api/conversation/turn', {
          sessionId,
          userInput: normalizedInput,
          history: nextHistory.map((item) => ({ speaker: item.speaker, text: item.text })),
          targetLanguage: options.targetLanguage,
          supportLanguage: options.supportLanguage,
        }),
      );

      const turnData = response as {
        response?: string;
        feedback?: Feedback;
        subtitle?: { support?: string | null; pronunciation?: string | null };
      };
      if (!turnData.response) {
        throw new Error(copy.invalidTurnResponse);
      }

      const assistantTurn: SessionTurn = {
        speaker: 'assistant',
        text: turnData.response,
        supportTranslation: turnData.subtitle?.support ?? undefined,
        pronunciation: turnData.subtitle?.pronunciation ?? undefined,
        feedback: turnData.feedback,
      };

      const merged = [...nextHistory, assistantTurn];
      setHistorySafely(merged);
      return assistantTurn;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : copy.defaultError;
      setError(message);
      throw caughtError;
    } finally {
      setIsLoading(false);
    }
  };

  const resumeSession = async (existingSessionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await safeJsonParse(await apiRequest('POST', '/api/conversation/resume', { sessionId: existingSessionId }));
      const resumeData = response as {
        sessionId?: string;
        history?: Array<{ speaker: 'user' | 'assistant' | 'character'; text: string }>;
      };

      if (!resumeData.sessionId || !Array.isArray(resumeData.history)) {
        throw new Error(copy.invalidResumeResponse);
      }

      const restoredHistory: SessionTurn[] = resumeData.history.map((item) => ({
        speaker: item.speaker === 'user' ? 'user' : 'assistant',
        text: item.text,
      }));

      setSessionId(resumeData.sessionId);
      setHistorySafely(restoredHistory);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : copy.defaultError;
      setError(message);
      throw caughtError;
    } finally {
      setIsLoading(false);
    }
  };

  const resetSession = () => {
    setSessionId(null);
    setHistorySafely([]);
    setError(null);
  };

  return { sessionId, history, isLoading, error, startSession, sendTurn, resumeSession, resetSession };
}
