// Shared conversation session hook to unify start/turn/resume flows across pages.
import { useMemo, useRef, useState } from 'react';
import { apiRequest, safeJsonParse } from '@/lib/queryClient';

export interface Feedback {
  accuracy: number | null;
  naturalness?: number | null;
  correction?: string | null;
  betterExpression?: string | null;
  koreanExplanation?: string | null;
}

export interface SessionTurn {
  speaker: 'user' | 'assistant';
  text: string;
  audioUrl?: string;
  koreanTranslation?: string;
  pronunciation?: string;
  feedback?: Feedback;
}

interface UseConversationSessionOptions {
  scenarioId: string;
  character: { name: string; gender: 'male' | 'female'; style: 'cheerful' | 'calm' | 'strict' };
  audience: 'student' | 'general' | 'business';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

const DEFAULT_ERROR_MESSAGE = '요청 처리 중 오류가 발생했습니다.';

export function useConversationSession(options: UseConversationSessionOptions) {
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
      userGoal: `${options.audience} 일본어 대화 연습`,
    }),
    [options],
  );

  const startSession = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await safeJsonParse(await apiRequest('POST', '/api/conversation/start', payloadBase));
      const startData = response as { sessionId?: string; initialPrompt?: string };
      if (!startData.sessionId || !startData.initialPrompt) {
        throw new Error('세션 응답 형식이 올바르지 않습니다.');
      }

      const openingMessage: SessionTurn = { speaker: 'assistant', text: startData.initialPrompt };
      setSessionId(startData.sessionId);
      setHistorySafely([openingMessage]);
      return { sessionId: startData.sessionId, openingMessage };
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : DEFAULT_ERROR_MESSAGE;
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
        throw new Error('세션이 초기화되지 않았습니다.');
      }

      const normalizedInput = userInput.trim();
      if (!normalizedInput) {
        throw new Error('입력 문장이 비어 있습니다.');
      }

      const userTurn: SessionTurn = { speaker: 'user', text: normalizedInput };
      const nextHistory = [...historyRef.current, userTurn];
      const response = await safeJsonParse(
        await apiRequest('POST', '/api/conversation/turn', {
          sessionId,
          userInput: normalizedInput,
          history: nextHistory.map((item) => ({ speaker: item.speaker, text: item.text })),
        }),
      );

      const turnData = response as {
        response?: string;
        feedback?: Feedback;
        subtitle?: { ko?: string; yomigana?: string };
      };
      if (!turnData.response) {
        throw new Error('대화 응답 형식이 올바르지 않습니다.');
      }

      const assistantTurn: SessionTurn = {
        speaker: 'assistant',
        text: turnData.response,
        koreanTranslation: turnData.subtitle?.ko,
        pronunciation: turnData.subtitle?.yomigana,
        feedback: turnData.feedback,
      };

      const merged = [...nextHistory, assistantTurn];
      setHistorySafely(merged);
      return assistantTurn;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : DEFAULT_ERROR_MESSAGE;
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
        throw new Error('세션 복원 응답 형식이 올바르지 않습니다.');
      }

      const restoredHistory: SessionTurn[] = resumeData.history.map((item) => ({
        speaker: item.speaker === 'user' ? 'user' : 'assistant',
        text: item.text,
      }));

      setSessionId(resumeData.sessionId);
      setHistorySafely(restoredHistory);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : DEFAULT_ERROR_MESSAGE;
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
