import type { LanguageCode } from '@shared/language';

const SUPPORTED_PHASE2_LANGUAGES = new Set<LanguageCode>(['ja', 'en', 'ko', 'zh', 'th', 'fr', 'de', 'es', 'ar', 'vi']);
const SUPPORTED_SUPPORT_LANGUAGES = new Set<LanguageCode>(['ko', 'en', 'ja', 'fr', 'es', 'zh', 'th', 'de', 'ar', 'vi']);

type SupportedTargetLanguageCode = 'ja' | 'en' | 'ko' | 'zh' | 'th' | 'fr' | 'de' | 'es' | 'ar' | 'vi';
type SupportLanguageCode = 'ko' | 'en' | 'ja' | 'fr' | 'es' | 'zh' | 'th' | 'de' | 'ar' | 'vi';

export type DeterministicFeedbackText = {
  emptySuggestion: string;
  emptyPronunciation: string;
  emptyExplanation: string;
  successSuggestion: string;
  retrySuggestion: string;
  successPronunciation: string;
  retryPronunciation: string;
  retryCorrection: string;
  retryBetterExpression: string;
  successExplanation: string;
  retryExplanation: string;
};

export type SupportLanguageDescriptor = {
  code: SupportLanguageCode;
  englishName: string;
  explanationLabel: string;
  correctionLabel: string;
  betterExpressionLabel: string;
  suggestionsLabel: string;
};

export type Phase2LanguagePack = {
  languageCode: SupportedTargetLanguageCode;
  languageName: string;
  regex: RegExp;
  recognitionPrompt: string;
  ttsMessage: string;
  dialogueCreatedMessage: string;
  initialPrompt: (scenarioId: string, userGoal: string) => string;
  systemPrompt: (scenarioId: string, difficulty: string, userGoal: string) => string;
  getFeedback: (supportLanguage: LanguageCode) => DeterministicFeedbackText;
  responseSystemPrompt: string;
  buildConversationPrompt: (params: {
    characterName: string;
    topic: string;
    userInput: string;
    historyText: string;
    shouldConsiderEnding: boolean;
    supportLanguage: LanguageCode;
  }) => string;
  fallbackResponse: string;
  buildPronunciationGuide: (text: string) => string | null;
};

const SUPPORT_LANGUAGE_DESCRIPTORS: Record<SupportLanguageCode, SupportLanguageDescriptor> = {
  ko: {
    code: 'ko',
    englishName: 'Korean',
    explanationLabel: '한국어 설명',
    correctionLabel: '교정',
    betterExpressionLabel: '더 자연스러운 표현',
    suggestionsLabel: '학습 팁',
  },
  en: {
    code: 'en',
    englishName: 'English',
    explanationLabel: 'English explanation',
    correctionLabel: 'Correction',
    betterExpressionLabel: 'More natural expression',
    suggestionsLabel: 'Learning tips',
  },
  ja: {
    code: 'ja',
    englishName: 'Japanese',
    explanationLabel: '日本語の説明',
    correctionLabel: '修正',
    betterExpressionLabel: 'より自然な表現',
    suggestionsLabel: '学習ヒント',
  },
  fr: {
    code: 'fr',
    englishName: 'French',
    explanationLabel: 'Explication en français',
    correctionLabel: 'Correction',
    betterExpressionLabel: 'Expression plus naturelle',
    suggestionsLabel: "Conseils d'apprentissage",
  },
  es: {
    code: 'es',
    englishName: 'Spanish',
    explanationLabel: 'Explicación en español',
    correctionLabel: 'Corrección',
    betterExpressionLabel: 'Expresión más natural',
    suggestionsLabel: 'Consejos de aprendizaje',
  },
  zh: {
    code: 'zh',
    englishName: 'Chinese',
    explanationLabel: 'Chinese explanation',
    correctionLabel: 'Correction',
    betterExpressionLabel: 'More natural expression',
    suggestionsLabel: 'Learning tips',
  },
  th: {
    code: 'th',
    englishName: 'Thai',
    explanationLabel: 'Thai explanation',
    correctionLabel: 'Correction',
    betterExpressionLabel: 'More natural expression',
    suggestionsLabel: 'Learning tips',
  },
  de: {
    code: 'de',
    englishName: 'German',
    explanationLabel: 'German explanation',
    correctionLabel: 'Correction',
    betterExpressionLabel: 'More natural expression',
    suggestionsLabel: 'Learning tips',
  },
  ar: {
    code: 'ar',
    englishName: 'Arabic',
    explanationLabel: 'Arabic explanation',
    correctionLabel: 'Correction',
    betterExpressionLabel: 'More natural expression',
    suggestionsLabel: 'Learning tips',
  },
  vi: {
    code: 'vi',
    englishName: 'Vietnamese',
    explanationLabel: 'Vietnamese explanation',
    correctionLabel: 'Correction',
    betterExpressionLabel: 'More natural expression',
    suggestionsLabel: 'Learning tips',
  },
};

const PHASE2_FEEDBACK_COPY: Partial<Record<SupportedTargetLanguageCode, Partial<Record<SupportLanguageCode, DeterministicFeedbackText>>>> = {
  ja: {
    ko: {
      emptySuggestion: '짧은 일본어 문장부터 입력해보세요.',
      emptyPronunciation: '입력이 없어 발음 피드백을 제공하지 않았습니다.',
      emptyExplanation: '입력이 비어 있어 기본 피드백만 제공합니다.',
      successSuggestion: '문장을 한 문장 더 이어서 말하면 자연스러움이 좋아집니다.',
      retrySuggestion: '일본어 문자를 포함해서 다시 말해보세요.',
      successPronunciation: '전반적으로 안정적입니다. 문장 끝 억양을 조금 더 부드럽게 해보세요.',
      retryPronunciation: '일본어 발음 피드백을 위해 일본어 문장을 입력해주세요.',
      retryCorrection: '예: すみません、もう一度お願いします。',
      retryBetterExpression: '짧아도 일본어 표현을 직접 넣어보세요.',
      successExplanation: '문장 길이와 문장부호를 기준으로 기본 평가를 제공했습니다.',
      retryExplanation: '일본어 문자가 없어 기초 점수로 평가했습니다.',
    },
    en: {
      emptySuggestion: 'Try entering a short Japanese sentence first.',
      emptyPronunciation: 'No pronunciation feedback was generated because the input was empty.',
      emptyExplanation: 'The input was empty, so only basic feedback is available.',
      successSuggestion: 'Add one more sentence to make the Japanese flow feel more natural.',
      retrySuggestion: 'Try again with some Japanese text so I can score it more accurately.',
      successPronunciation: 'Overall pronunciation looks stable. Try softening the sentence-final intonation a little more.',
      retryPronunciation: 'Please enter a Japanese sentence so I can give pronunciation feedback.',
      retryCorrection: 'Example: すみません、もう一度お願いします。',
      retryBetterExpression: 'Even a short Japanese phrase is enough to get started.',
      successExplanation: 'This baseline score uses Japanese text presence, length, and punctuation as quick signals.',
      retryExplanation: 'No Japanese text was detected, so the score was kept conservative.',
    },
    ja: {
      emptySuggestion: 'まずは短い日本語の文を入力してみましょう。',
      emptyPronunciation: '入力がないため、発音フィードバックはありません。',
      emptyExplanation: '入力が空のため、基本フィードバックのみを表示しています。',
      successSuggestion: 'もう一文続けると、より自然な会話になります。',
      retrySuggestion: '日本語を入れてもう一度試してみましょう。',
      successPronunciation: '全体的に安定しています。文末のイントネーションを少しやわらかくするとさらに自然です。',
      retryPronunciation: '発音フィードバックのために日本語の文を入力してください。',
      retryCorrection: '例: すみません、もう一度お願いします。',
      retryBetterExpression: '短くても日本語の表現を直接入れてみましょう。',
      successExplanation: '文の長さと句読点をもとにした基本評価です。',
      retryExplanation: '日本語の文字が見つからなかったため、控えめに評価しました。',
    },
  },
  en: {
    ko: {
      emptySuggestion: '짧은 영어 문장부터 입력해보세요.',
      emptyPronunciation: '입력이 없어 발음 피드백을 제공하지 않았습니다.',
      emptyExplanation: '입력이 비어 있어 기본 피드백만 제공합니다.',
      successSuggestion: '한 문장만 더 이어 말하면 훨씬 자연스럽게 들립니다.',
      retrySuggestion: '영어 문장을 넣어서 다시 시도해보세요.',
      successPronunciation: '전반적으로 안정적입니다. 문장 끝 억양을 조금 더 연결해보세요.',
      retryPronunciation: '영어 발음 피드백을 위해 영어 문장을 입력해주세요.',
      retryCorrection: '예: Could you say that one more time, please?',
      retryBetterExpression: '짧아도 영어 표현을 직접 넣어보세요.',
      successExplanation: '문장 길이와 문장부호를 기준으로 빠른 기본 평가를 제공했습니다.',
      retryExplanation: '영어 텍스트가 감지되지 않아 보수적으로 평가했습니다.',
    },
    en: {
      emptySuggestion: 'Try saying a short English sentence first.',
      emptyPronunciation: 'No pronunciation feedback was generated because the input was empty.',
      emptyExplanation: 'The input was empty, so only basic feedback is available.',
      successSuggestion: 'Add one more sentence to sound more natural and connected.',
      retrySuggestion: 'Try again with an English sentence so I can grade it properly.',
      successPronunciation: 'Overall pronunciation looks stable. Try smoothing out the final intonation a little more.',
      retryPronunciation: 'Please enter an English sentence so I can give pronunciation feedback.',
      retryCorrection: 'Example: Could you say that one more time, please?',
      retryBetterExpression: 'Even a short English phrase is enough to start.',
      successExplanation: 'This basic score uses sentence length and punctuation as quick signals.',
      retryExplanation: 'No English text was detected, so this was scored conservatively.',
    },
    ja: {
      emptySuggestion: 'まずは短い英語の文を入力してみましょう。',
      emptyPronunciation: '入力がないため、発音フィードバックはありません。',
      emptyExplanation: '入力が空のため、基本フィードバックのみを表示しています。',
      successSuggestion: 'もう一文続けると、より自然でつながりのある英語になります。',
      retrySuggestion: '英語の文を入れてもう一度試してみましょう。',
      successPronunciation: '全体的に安定しています。文末のイントネーションを少しなめらかにするとさらに自然です。',
      retryPronunciation: '発音フィードバックのために英語の文を入力してください。',
      retryCorrection: '例: Could you say that one more time, please?',
      retryBetterExpression: '短い英語フレーズだけでも十分に始められます。',
      successExplanation: '文の長さと句読点をもとにした基本評価です。',
      retryExplanation: '英語テキストが見つからなかったため、控えめに評価しました。',
    },
  },
  ko: {
    ko: {
      emptySuggestion: '짧은 한국어 문장부터 입력해보세요.',
      emptyPronunciation: '입력이 없어 발음 피드백을 제공하지 않았습니다.',
      emptyExplanation: '입력이 비어 있어 기본 피드백만 제공합니다.',
      successSuggestion: '문장을 한 문장 더 이어 말하면 훨씬 자연스럽습니다.',
      retrySuggestion: '한국어 문장을 넣어서 다시 시도해보세요.',
      successPronunciation: '전반적으로 안정적입니다. 받침 발음과 문장 끝 억양을 조금 더 또렷하게 해보세요.',
      retryPronunciation: '한국어 발음 피드백을 위해 한국어 문장을 입력해주세요.',
      retryCorrection: '예: 죄송하지만 한 번만 더 말씀해 주세요.',
      retryBetterExpression: '짧아도 한국어 표현을 직접 넣어보세요.',
      successExplanation: '문장 길이와 문장부호를 기준으로 빠른 기본 평가를 제공했습니다.',
      retryExplanation: '한국어 텍스트가 감지되지 않아 보수적으로 평가했습니다.',
    },
    en: {
      emptySuggestion: 'Try entering a short Korean sentence first.',
      emptyPronunciation: 'No pronunciation feedback was generated because the input was empty.',
      emptyExplanation: 'The input was empty, so only basic feedback is available.',
      successSuggestion: 'Add one more sentence to make the Korean flow sound more natural.',
      retrySuggestion: 'Try again with some Korean text so I can score it more accurately.',
      successPronunciation: 'Overall pronunciation looks stable. Try making final consonants and sentence-final intonation a bit clearer.',
      retryPronunciation: 'Please enter a Korean sentence so I can give pronunciation feedback.',
      retryCorrection: 'Example: 죄송하지만 한 번만 더 말씀해 주세요.',
      retryBetterExpression: 'Even a short Korean phrase is enough to get started.',
      successExplanation: 'This baseline score uses Korean text presence, length, and punctuation as quick signals.',
      retryExplanation: 'No Korean text was detected, so the score was kept conservative.',
    },
    ja: {
      emptySuggestion: 'まずは短い韓国語の文を入力してみましょう。',
      emptyPronunciation: '入力がないため、発音フィードバックはありません。',
      emptyExplanation: '入力が空のため、基本フィードバックのみを表示しています。',
      successSuggestion: 'もう一文続けると、より自然な韓国語になります。',
      retrySuggestion: '韓国語の文を入れてもう一度試してみましょう。',
      successPronunciation: '全体的に安定しています。パッチムと文末イントネーションをもう少しはっきりさせるとさらに自然です。',
      retryPronunciation: '発音フィードバックのために韓国語の文を入力してください。',
      retryCorrection: '例: 죄송하지만 한 번만 더 말씀해 주세요.',
      retryBetterExpression: '短い韓国語フレーズだけでも十分に始められます。',
      successExplanation: '文の長さと句読点をもとにした基本評価です。',
      retryExplanation: '韓国語テキストが見つからなかったため、控えめに評価しました。',
    },
  },
  fr: {
    ko: {
      emptySuggestion: '짧은 프랑스어 문장부터 입력해보세요.',
      emptyPronunciation: '입력이 없어 발음 피드백을 제공하지 않았습니다.',
      emptyExplanation: '입력이 비어 있어 기본 피드백만 제공합니다.',
      successSuggestion: '한 문장만 더 이어 말하면 프랑스어 흐름이 더 자연스러워집니다.',
      retrySuggestion: '프랑스어 문장을 넣어서 다시 시도해보세요.',
      successPronunciation: '전반적으로 안정적입니다. 강세와 문장 끝 억양을 조금 더 또렷하게 해보세요.',
      retryPronunciation: '프랑스어 발음 피드백을 위해 프랑스어 문장을 입력해주세요.',
      retryCorrection: "예: Pourriez-vous le répéter une fois, s'il vous plaît ?",
      retryBetterExpression: '짧아도 프랑스어 표현을 직접 넣어보세요.',
      successExplanation: '문장 길이와 문장부호를 기준으로 빠른 기본 평가를 제공했습니다.',
      retryExplanation: '프랑스어 텍스트가 감지되지 않아 보수적으로 평가했습니다.',
    },
    en: {
      emptySuggestion: 'Try entering a short French sentence first.',
      emptyPronunciation: 'No pronunciation feedback was generated because the input was empty.',
      emptyExplanation: 'The input was empty, so only basic feedback is available.',
      successSuggestion: 'Add one more sentence to make the French flow sound more natural.',
      retrySuggestion: 'Try again with some French text so I can score it more accurately.',
      successPronunciation: 'Overall pronunciation looks stable. Try making stress and sentence-final intonation a bit clearer.',
      retryPronunciation: 'Please enter a French sentence so I can give pronunciation feedback.',
      retryCorrection: "Example: Pourriez-vous le répéter une fois, s'il vous plaît ?",
      retryBetterExpression: 'Even a short French phrase is enough to get started.',
      successExplanation: 'This baseline score uses French text presence, length, and punctuation as quick signals.',
      retryExplanation: 'No French text was detected, so the score was kept conservative.',
    },
    ja: {
      emptySuggestion: 'まずは短いフランス語の文を入力してみましょう。',
      emptyPronunciation: '入力がないため、発音フィードバックはありません。',
      emptyExplanation: '入力が空のため、基本フィードバックのみを表示しています。',
      successSuggestion: 'もう一文続けると、より自然なフランス語になります。',
      retrySuggestion: 'フランス語の文を入れてもう一度試してみましょう。',
      successPronunciation: '全体的に安定しています。アクセントと文末イントネーションをもう少しはっきりさせるとさらに自然です。',
      retryPronunciation: '発音フィードバックのためにフランス語の文を入力してください。',
      retryCorrection: "例: Pourriez-vous le répéter une fois, s'il vous plaît ?",
      retryBetterExpression: '短いフランス語フレーズだけでも十分に始められます。',
      successExplanation: '文の長さと句読点をもとにした基本評価です。',
      retryExplanation: 'フランス語テキストが見つからなかったため、控えめに評価しました。',
    },
  },
  es: {
    ko: {
      emptySuggestion: '짧은 스페인어 문장부터 입력해보세요.',
      emptyPronunciation: '입력이 없어 발음 피드백을 제공하지 않았습니다.',
      emptyExplanation: '입력이 비어 있어 기본 피드백만 제공합니다.',
      successSuggestion: '한 문장만 더 이어 말하면 스페인어 흐름이 더 자연스러워집니다.',
      retrySuggestion: '스페인어 문장을 넣어서 다시 시도해보세요.',
      successPronunciation: '전반적으로 안정적입니다. 강세와 문장 끝 억양을 조금 더 또렷하게 해보세요.',
      retryPronunciation: '스페인어 발음 피드백을 위해 스페인어 문장을 입력해주세요.',
      retryCorrection: '예: ¿Podría repetirlo una vez más, por favor?',
      retryBetterExpression: '짧아도 스페인어 표현을 직접 넣어보세요.',
      successExplanation: '문장 길이와 문장부호를 기준으로 빠른 기본 평가를 제공했습니다.',
      retryExplanation: '스페인어 텍스트가 감지되지 않아 보수적으로 평가했습니다.',
    },
    en: {
      emptySuggestion: 'Try entering a short Spanish sentence first.',
      emptyPronunciation: 'No pronunciation feedback was generated because the input was empty.',
      emptyExplanation: 'The input was empty, so only basic feedback is available.',
      successSuggestion: 'Add one more sentence to make the Spanish flow sound more natural.',
      retrySuggestion: 'Try again with some Spanish text so I can score it more accurately.',
      successPronunciation: 'Overall pronunciation looks stable. Try making stress and sentence-final intonation a bit clearer.',
      retryPronunciation: 'Please enter a Spanish sentence so I can give pronunciation feedback.',
      retryCorrection: 'Example: ¿Podría repetirlo una vez más, por favor?',
      retryBetterExpression: 'Even a short Spanish phrase is enough to get started.',
      successExplanation: 'This baseline score uses Spanish text presence, length, and punctuation as quick signals.',
      retryExplanation: 'No Spanish text was detected, so the score was kept conservative.',
    },
    ja: {
      emptySuggestion: 'まずは短いスペイン語の文を入力してみましょう。',
      emptyPronunciation: '入力がないため、発音フィードバックはありません。',
      emptyExplanation: '入力が空のため、基本フィードバックのみを表示しています。',
      successSuggestion: 'もう一文続けると、より自然なスペイン語になります。',
      retrySuggestion: 'スペイン語の文を入れてもう一度試してみましょう。',
      successPronunciation: '全体的に安定しています。アクセントと文末イントネーションをもう少しはっきりさせるとさらに自然です。',
      retryPronunciation: '発音フィードバックのためにスペイン語の文を入力してください。',
      retryCorrection: '例: ¿Podría repetirlo una vez más, por favor?',
      retryBetterExpression: '短いスペイン語フレーズだけでも十分に始められます。',
      successExplanation: '文の長さと句読点をもとにした基本評価です。',
      retryExplanation: 'スペイン語テキストが見つからなかったため、控えめに評価しました。',
    },
  },
};

for (const targetLanguage of Object.keys(PHASE2_FEEDBACK_COPY) as SupportedTargetLanguageCode[]) {
  for (const supportLanguage of ['fr', 'es', 'zh', 'th', 'de', 'ar', 'vi'] as const) {
    PHASE2_FEEDBACK_COPY[targetLanguage]![supportLanguage] = { ...PHASE2_FEEDBACK_COPY[targetLanguage]!.en! };
  }
}

function toSupportedSupportLanguage(language: LanguageCode): SupportLanguageCode {
  if (SUPPORTED_SUPPORT_LANGUAGES.has(language)) {
    return language as SupportLanguageCode;
  }
  return 'en';
}

function getSupportInstructionLine(targetLanguageName: string, support: SupportLanguageDescriptor) {
  return `If the learner makes a ${targetLanguageName} mistake, explain it briefly in ${support.englishName}. Use feedback.explanation, feedback.correction, feedback.betterExpression, and feedback.suggestions in ${support.englishName}.`;
}

function buildConversationPromptTemplate(targetLanguageName: string, responseLanguageLabel: string, params: Parameters<Phase2LanguagePack['buildConversationPrompt']>[0]) {
  const support = SUPPORT_LANGUAGE_DESCRIPTORS[toSupportedSupportLanguage(params.supportLanguage)];
  return `You are ${params.characterName}, naturally role-playing inside the ${params.topic} scenario.

Previous conversation:
${params.historyText || '(none)'}

User just said: "${params.userInput}"

Instructions:
1. Reply only in natural ${responseLanguageLabel}.
2. Sound like a real conversation partner, not a formal assistant.
3. Keep the reply short and conversational (1-2 sentences).
4. Move the scenario forward naturally.
${params.shouldConsiderEnding ? '5. If the task feels complete, you may end the conversation naturally.\n' : ''}6. If supportLanguage differs from ${responseLanguageLabel}, include a short learner-friendly support translation in ${support.englishName}.
7. Include a pronunciationGuide only when it actually helps the learner.
8. ${getSupportInstructionLine(targetLanguageName, support)}

Return JSON:
{
  "response": "natural ${responseLanguageLabel} reply",
  "supportTranslation": "optional short ${support.englishName} translation",
  "pronunciationGuide": "optional pronunciation guide",
  "feedback": {
    "accuracy": 85,
    "needsCorrection": false,
    "explanation": "${support.explanationLabel}",
    "correction": "${support.correctionLabel}",
    "betterExpression": "${support.betterExpressionLabel}",
    "suggestions": ["${support.suggestionsLabel}"]
  },
  "shouldEndConversation": false,
  "endingMessage": "optional natural ending"
}`;
}

const PHASE2_LANGUAGE_PACKS: Record<SupportedTargetLanguageCode, Phase2LanguagePack> = {
  ja: {
    languageCode: 'ja', languageName: 'Japanese', regex: /[぀-ヿ㐀-龿]/,
    recognitionPrompt: '日本語で話してください。沈黙や雑音は無視してください。',
    ttsMessage: '日本語音声が生成されました！',
    dialogueCreatedMessage: '일본어 대화가 생성되었습니다!',
    initialPrompt: (scenarioId, userGoal) => `${scenarioId} 상황에서 ${userGoal} 목표를 연습해봅시다.`,
    systemPrompt: (scenarioId, difficulty, userGoal) => `You are a Japanese tutor role-playing scenario ${scenarioId}. Difficulty: ${difficulty}. Goal: ${userGoal}. Keep responses concise and natural Japanese.`,
    getFeedback: (supportLanguage) => PHASE2_FEEDBACK_COPY.ja![toSupportedSupportLanguage(supportLanguage)]!,
    responseSystemPrompt: 'You are a Japanese conversation tutor. Reply only in Japanese and return valid JSON.',
    buildConversationPrompt: (params) => buildConversationPromptTemplate('Japanese', 'Japanese', params),
    fallbackResponse: 'すみません、よくわかりませんでした。他の言い方で話してみてください。',
    buildPronunciationGuide: (text) => text,
  },
  en: {
    languageCode: 'en', languageName: 'English', regex: /[A-Za-z]/,
    recognitionPrompt: 'Please speak in English. Ignore silence, taps, and background noise.',
    ttsMessage: 'English audio has been generated!',
    dialogueCreatedMessage: '영어 대화가 생성되었습니다!',
    initialPrompt: (scenarioId, userGoal) => `Let's practice the ${scenarioId} scene. Goal: ${userGoal}.`,
    systemPrompt: (scenarioId, difficulty, userGoal) => `You are an English tutor role-playing scenario ${scenarioId}. Difficulty: ${difficulty}. Goal: ${userGoal}. Keep responses concise and natural English.`,
    getFeedback: (supportLanguage) => PHASE2_FEEDBACK_COPY.en![toSupportedSupportLanguage(supportLanguage)]!,
    responseSystemPrompt: 'You are an English conversation tutor. Reply only in English and return valid JSON.',
    buildConversationPrompt: (params) => buildConversationPromptTemplate('English', 'English', params),
    fallbackResponse: 'Sorry, I did not fully catch that. Could you try saying it another way?',
    buildPronunciationGuide: () => null,
  },
  ko: {
    languageCode: 'ko', languageName: 'Korean', regex: /[가-힣ㄱ-ㅎㅏ-ㅣ]/,
    recognitionPrompt: '한국어로 말해주세요. 침묵이나 잡음은 무시해주세요.',
    ttsMessage: '한국어 음성이 생성되었습니다!',
    dialogueCreatedMessage: '한국어 대화가 생성되었습니다!',
    initialPrompt: (scenarioId, userGoal) => `${scenarioId} 상황에서 ${userGoal} 목표를 연습해봅시다.`,
    systemPrompt: (scenarioId, difficulty, userGoal) => `You are a Korean tutor role-playing scenario ${scenarioId}. Difficulty: ${difficulty}. Goal: ${userGoal}. Keep responses concise and natural Korean.`,
    getFeedback: (supportLanguage) => PHASE2_FEEDBACK_COPY.ko![toSupportedSupportLanguage(supportLanguage)]!,
    responseSystemPrompt: 'You are a Korean conversation tutor. Reply only in Korean and return valid JSON.',
    buildConversationPrompt: (params) => buildConversationPromptTemplate('Korean', 'Korean', params),
    fallbackResponse: '죄송해요, 잘 이해하지 못했어요. 다른 표현으로 다시 말해 주세요.',
    buildPronunciationGuide: (text) => text,
  },
  es: {
    languageCode: 'es', languageName: 'Spanish', regex: /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ¿¡]/,
    recognitionPrompt: 'Por favor, habla en español. Ignora el silencio, los toques y el ruido de fondo.',
    ttsMessage: '¡Se ha generado el audio en español!',
    dialogueCreatedMessage: '스페인어 대화가 생성되었습니다!',
    initialPrompt: (scenarioId, userGoal) => `Practiquemos la escena ${scenarioId}. Objetivo: ${userGoal}.`,
    systemPrompt: (scenarioId, difficulty, userGoal) => `You are a Spanish tutor role-playing scenario ${scenarioId}. Difficulty: ${difficulty}. Goal: ${userGoal}. Keep responses concise and natural Spanish.`,
    getFeedback: (supportLanguage) => PHASE2_FEEDBACK_COPY.es![toSupportedSupportLanguage(supportLanguage)]!,
    responseSystemPrompt: 'You are a Spanish conversation tutor. Reply only in Spanish and return valid JSON.',
    buildConversationPrompt: (params) => buildConversationPromptTemplate('Spanish', 'Spanish', params),
    fallbackResponse: 'Lo siento, no lo entendí bien. ¿Podrías decirlo de otra manera?',
    buildPronunciationGuide: () => null,
  },
  fr: {
    languageCode: 'fr', languageName: 'French', regex: /[A-Za-zÀÂÆÇÉÈÊËÎÏÔŒÙÛÜŸàâæçéèêëîïôœùûüÿ]/,
    recognitionPrompt: 'Veuillez parler en français. Ignorez le silence, les clics et le bruit de fond.',
    ttsMessage: "L'audio en français a été généré !",
    dialogueCreatedMessage: '프랑스어 대화가 생성되었습니다!',
    initialPrompt: (scenarioId, userGoal) => `Pratiquons la scène ${scenarioId}. Objectif : ${userGoal}.`,
    systemPrompt: (scenarioId, difficulty, userGoal) => `You are a French tutor role-playing scenario ${scenarioId}. Difficulty: ${difficulty}. Goal: ${userGoal}. Keep responses concise and natural French.`,
    getFeedback: (supportLanguage) => PHASE2_FEEDBACK_COPY.fr![toSupportedSupportLanguage(supportLanguage)]!,
    responseSystemPrompt: 'You are a French conversation tutor. Reply only in French and return valid JSON.',
    buildConversationPrompt: (params) => buildConversationPromptTemplate('French', 'French', params),
    fallbackResponse: "Désolé, je n'ai pas bien compris. Pouvez-vous le reformuler ?",
    buildPronunciationGuide: () => null,
  },
  zh: {
    languageCode: 'zh', languageName: 'Chinese', regex: /[㐀-鿿]/,
    recognitionPrompt: '请用中文说话。请忽略沉默、点击声和背景噪音。',
    ttsMessage: '已生成中文语音！',
    dialogueCreatedMessage: '중국어 대화가 생성되었습니다!',
    initialPrompt: (scenarioId, userGoal) => `让我们练习 ${scenarioId} 场景。目标：${userGoal}。`,
    systemPrompt: (scenarioId, difficulty, userGoal) => `You are a Chinese tutor role-playing scenario ${scenarioId}. Difficulty: ${difficulty}. Goal: ${userGoal}. Keep responses concise and natural Chinese.`,
    getFeedback: (supportLanguage) => PHASE2_FEEDBACK_COPY.en![toSupportedSupportLanguage(supportLanguage)]!,
    responseSystemPrompt: 'You are a Chinese conversation tutor. Reply only in Chinese and return valid JSON.',
    buildConversationPrompt: (params) => buildConversationPromptTemplate('Chinese', 'Chinese', params),
    fallbackResponse: '抱歉，我没有完全听懂。可以换一种说法吗？',
    buildPronunciationGuide: () => null,
  },
  th: {
    languageCode: 'th', languageName: 'Thai', regex: /[฀-๿]/,
    recognitionPrompt: 'กรุณาพูดเป็นภาษาไทย และละเว้นความเงียบ เสียงแตะ และเสียงรบกวนพื้นหลัง',
    ttsMessage: 'สร้างเสียงภาษาไทยแล้ว!',
    dialogueCreatedMessage: '태국어 대화가 생성되었습니다!',
    initialPrompt: (scenarioId, userGoal) => `มาฝึกสถานการณ์ ${scenarioId} กัน เป้าหมาย: ${userGoal}`,
    systemPrompt: (scenarioId, difficulty, userGoal) => `You are a Thai tutor role-playing scenario ${scenarioId}. Difficulty: ${difficulty}. Goal: ${userGoal}. Keep responses concise and natural Thai.`,
    getFeedback: (supportLanguage) => PHASE2_FEEDBACK_COPY.en![toSupportedSupportLanguage(supportLanguage)]!,
    responseSystemPrompt: 'You are a Thai conversation tutor. Reply only in Thai and return valid JSON.',
    buildConversationPrompt: (params) => buildConversationPromptTemplate('Thai', 'Thai', params),
    fallbackResponse: 'ขอโทษนะ ฉันยังฟังไม่ชัด ลองพูดอีกแบบได้ไหม',
    buildPronunciationGuide: () => null,
  },
  de: {
    languageCode: 'de', languageName: 'German', regex: /[A-Za-zÄÖÜäöüß]/,
    recognitionPrompt: 'Bitte sprich auf Deutsch. Ignoriere Stille, Tippgeräusche und Hintergrundgeräusche.',
    ttsMessage: 'Deutsches Audio wurde erzeugt!',
    dialogueCreatedMessage: '독일어 대화가 생성되었습니다!',
    initialPrompt: (scenarioId, userGoal) => `Lass uns die Szene ${scenarioId} üben. Ziel: ${userGoal}.`,
    systemPrompt: (scenarioId, difficulty, userGoal) => `You are a German tutor role-playing scenario ${scenarioId}. Difficulty: ${difficulty}. Goal: ${userGoal}. Keep responses concise and natural German.`,
    getFeedback: (supportLanguage) => PHASE2_FEEDBACK_COPY.en![toSupportedSupportLanguage(supportLanguage)]!,
    responseSystemPrompt: 'You are a German conversation tutor. Reply only in German and return valid JSON.',
    buildConversationPrompt: (params) => buildConversationPromptTemplate('German', 'German', params),
    fallbackResponse: 'Entschuldigung, ich habe das nicht ganz verstanden. Kannst du es anders sagen?',
    buildPronunciationGuide: () => null,
  },
  ar: {
    languageCode: 'ar', languageName: 'Arabic', regex: /[؀-ۿ]/,
    recognitionPrompt: 'يرجى التحدث باللغة العربية وتجاهل الصمت والضغطات وضوضاء الخلفية.',
    ttsMessage: 'تم إنشاء الصوت العربي!',
    dialogueCreatedMessage: '아랍어 대화가 생성되었습니다!',
    initialPrompt: (scenarioId, userGoal) => `لنتدرّب على مشهد ${scenarioId}. الهدف: ${userGoal}.`,
    systemPrompt: (scenarioId, difficulty, userGoal) => `You are an Arabic tutor role-playing scenario ${scenarioId}. Difficulty: ${difficulty}. Goal: ${userGoal}. Keep responses concise and natural Arabic.`,
    getFeedback: (supportLanguage) => PHASE2_FEEDBACK_COPY.en![toSupportedSupportLanguage(supportLanguage)]!,
    responseSystemPrompt: 'You are an Arabic conversation tutor. Reply only in Arabic and return valid JSON.',
    buildConversationPrompt: (params) => buildConversationPromptTemplate('Arabic', 'Arabic', params),
    fallbackResponse: 'عذرًا، لم أفهم جيدًا. هل يمكنك قول ذلك بطريقة أخرى؟',
    buildPronunciationGuide: () => null,
  },
  vi: {
    languageCode: 'vi', languageName: 'Vietnamese', regex: /[A-Za-zÀ-ỹĐđ]/,
    recognitionPrompt: 'Vui lòng nói bằng tiếng Việt. Bỏ qua khoảng lặng, tiếng chạm và tiếng ồn nền.',
    ttsMessage: 'Đã tạo âm thanh tiếng Việt!',
    dialogueCreatedMessage: '베트남어 대화가 생성되었습니다!',
    initialPrompt: (scenarioId, userGoal) => `Hãy luyện tập tình huống ${scenarioId}. Mục tiêu: ${userGoal}.`,
    systemPrompt: (scenarioId, difficulty, userGoal) => `You are a Vietnamese tutor role-playing scenario ${scenarioId}. Difficulty: ${difficulty}. Goal: ${userGoal}. Keep responses concise and natural Vietnamese.`,
    getFeedback: (supportLanguage) => PHASE2_FEEDBACK_COPY.en![toSupportedSupportLanguage(supportLanguage)]!,
    responseSystemPrompt: 'You are a Vietnamese conversation tutor. Reply only in Vietnamese and return valid JSON.',
    buildConversationPrompt: (params) => buildConversationPromptTemplate('Vietnamese', 'Vietnamese', params),
    fallbackResponse: 'Xin lỗi, tôi chưa hiểu rõ. Bạn có thể nói cách khác không?',
    buildPronunciationGuide: () => null,
  },
};

export function getPhase2LanguagePack(language: LanguageCode): Phase2LanguagePack {
  if (SUPPORTED_PHASE2_LANGUAGES.has(language)) {
    return PHASE2_LANGUAGE_PACKS[language as SupportedTargetLanguageCode];
  }
  return PHASE2_LANGUAGE_PACKS.ja;
}

export function getSupportLanguageDescriptor(language: LanguageCode): SupportLanguageDescriptor {
  return SUPPORT_LANGUAGE_DESCRIPTORS[toSupportedSupportLanguage(language)];
}


export function getLanguageLabel(language: LanguageCode): string {
  const pack = getPhase2LanguagePack(language);
  return pack.languageName;
}

export function getPhase2SpeechRecognitionLanguage(language: LanguageCode) {
  return getPhase2LanguagePack(language).languageCode;
}
