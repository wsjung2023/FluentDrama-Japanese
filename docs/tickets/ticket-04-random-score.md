# Ticket 04 — 랜덤 점수 제거 & 실질 피드백 교체

  ## 문제 요약
  `server/routes/aiCoreRoutes.ts`에 두 곳에서 Math.random() 기반 점수 사용:
  - line 346: `accuracy: Math.floor(Math.random() * 21) + 80` (conversation/turn)
  - line 489: `feedback: { accuracy: Math.floor(Math.random() * 20) + 80 }` (conversation-response)

  ## 수정 방법

  ### 방법 A: LLM structured output으로 피드백 생성 (권장)
  `/api/conversation/turn` 처리 시 별도 GPT 호출로 피드백 생성:

  ```ts
  // aiCoreRoutes.ts — conversation/turn 핸들러 내부 (line 345 근처)
  const feedbackPrompt = [
    { role: 'system', content: `You are a Japanese language evaluator.
  Rate the user's Japanese response on:
  - accuracy (0-100): grammar correctness
  - naturalness (0-100): how native-speaker-like it sounds
  Provide:
  - correction: corrected version if needed (null if perfect)
  - betterExpression: a more natural alternative (null if already natural)
  - koreanExplanation: brief Korean explanation of the issue (1-2 sentences)
  Respond ONLY in JSON: { accuracy, naturalness, correction, betterExpression, koreanExplanation }` },
    { role: 'user', content: `Scenario: ${scenarioId}\nUser said: ${userInput}` }
  ];

  const feedbackResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: feedbackPrompt, max_tokens: 200, response_format: { type: 'json_object' } })
  });

  let feedback;
  try {
    const feedbackData = await feedbackResponse.json();
    feedback = JSON.parse(feedbackData.choices[0].message.content);
  } catch {
    // fallback: 점수 숨기고 교정 없이 응답
    feedback = { accuracy: null, naturalness: null, correction: null };
  }
  ```

  ### 방법 B: deterministic rubric (gpt-4o-mini 미사용 시 fallback)
  사용자 입력 텍스트 기반 간단 휴리스틱:
  ```ts
  function computeBasicScore(userInput: string): { accuracy: number | null } {
    if (!userInput || userInput.trim().length === 0) return { accuracy: null };
    
    const hasJapanese = /[぀-ゟ゠-ヿ一-龯]/.test(userInput);
    if (!hasJapanese) return { accuracy: 30 }; // 일본어 없음
    
    const wordCount = userInput.trim().split(/s+/).length;
    if (wordCount < 2) return { accuracy: 55 }; // 너무 짧음
    
    return { accuracy: null }; // 판단 불가 시 숨김 처리
  }
  ```

  ### 적용 위치
  1. `aiCoreRoutes.ts` line 346: `Math.random()` → 방법 A 또는 B
  2. `aiCoreRoutes.ts` line 489: `Math.random()` → 방법 A 또는 B (또는 Ticket 03에서 deprecated 처리 시 자동 해결)

  ### 피드백 인터페이스 표준화 (shared/schema.ts 또는 types 파일)
  ```ts
  export interface ConversationFeedback {
    accuracy: number | null;        // null = 측정 불가, 점수 숨김
    naturalness: number | null;
    correction: string | null;      // 교정 문장
    betterExpression: string | null;
    koreanExplanation: string | null;
  }
  ```

  ## 완료 기준
  - Math.random() 기반 코드 제거됨
  - 같은 입력에 같은 피드백 결과 반환
  - 점수 측정 불가 시 숫자 숨기고 교정 문장만 표시

  ## 관련 파일
  - `server/routes/aiCoreRoutes.ts` (line 345-350, line 488-490)
  - `shared/schema.ts` (피드백 타입 추가 위치)
  