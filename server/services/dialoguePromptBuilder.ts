import type { GenerateDialogueRequest } from '@shared/schema';
import { LANGUAGE_METADATA, type LanguageCode } from '@shared/language';

const AUDIENCE_PROFILES = {
  student: {
    levelHint: 'early learner',
    vocabulary: 'simple everyday vocabulary and short sentences',
    topics: 'school life, hobbies, daily routines',
  },
  general: {
    levelHint: 'mid learner',
    vocabulary: 'practical conversational vocabulary and moderate sentence variety',
    topics: 'travel, work, social situations, daily life',
  },
  business: {
    levelHint: 'professional learner',
    vocabulary: 'formal vocabulary, business tone, and more structured phrasing',
    topics: 'meetings, presentations, negotiation, professional communication',
  },
} as const;

const STYLE_PROFILES = {
  cheerful: 'enthusiastic, warm, and encouraging',
  calm: 'patient, measured, and reassuring',
  strict: 'focused, concise, and instruction-oriented',
} as const;

const LANGUAGE_INSTRUCTIONS: Record<LanguageCode, { outputRule: string; phraseLabel: string }> = {
  ja: { outputRule: 'All dialogue lines must be written only in Japanese.', phraseLabel: 'useful Japanese phrases' },
  en: { outputRule: 'All dialogue lines must be written only in English.', phraseLabel: 'useful English phrases' },
  ko: { outputRule: 'All dialogue lines must be written only in Korean.', phraseLabel: 'useful Korean phrases' },
  zh: { outputRule: 'All dialogue lines must be written only in Chinese.', phraseLabel: 'useful Chinese phrases' },
  th: { outputRule: 'All dialogue lines must be written only in Thai.', phraseLabel: 'useful Thai phrases' },
  fr: { outputRule: 'All dialogue lines must be written only in French.', phraseLabel: 'useful French phrases' },
  de: { outputRule: 'All dialogue lines must be written only in German.', phraseLabel: 'useful German phrases' },
  es: { outputRule: 'All dialogue lines must be written only in Spanish.', phraseLabel: 'useful Spanish phrases' },
  ar: { outputRule: 'All dialogue lines must be written only in Arabic.', phraseLabel: 'useful Arabic phrases' },
  vi: { outputRule: 'All dialogue lines must be written only in Vietnamese.', phraseLabel: 'useful Vietnamese phrases' },
};

function getLanguageDescriptor(languageCode: LanguageCode) {
  const metadata = LANGUAGE_METADATA[languageCode];
  return {
    ...metadata,
    instruction: LANGUAGE_INSTRUCTIONS[languageCode],
  };
}

function buildJsonContract(phraseLabel: string) {
  return `Respond in JSON format:\n{\n  "lines": ["line1", "line2", "line3"],\n  "focus_phrases": ["${phraseLabel} 1", "${phraseLabel} 2", "${phraseLabel} 3"]\n}`;
}

export function buildDialoguePrompts(request: GenerateDialogueRequest) {
  const {
    audience,
    targetLanguage,
    supportLanguage,
    difficultyFramework,
    difficultyLevel,
    character,
    scenario,
  } = request;

  const audienceProfile = AUDIENCE_PROFILES[audience];
  const styleProfile = STYLE_PROFILES[character.style];
  const target = getLanguageDescriptor(targetLanguage);
  const support = getLanguageDescriptor(supportLanguage);
  const scenarioText = scenario.freeText || scenario.presetKey || 'general conversation';
  const isCustomScenario = Boolean(scenario.freeText?.trim());
  const jsonContract = buildJsonContract(target.instruction.phraseLabel);

  const systemPrompt = isCustomScenario
    ? [
        `You are ${character.name} in this scenario: ${scenarioText}.`,
        target.instruction.outputRule,
        `Target language: ${target.englishName}. Support language for explanations: ${support.englishName}.`,
        `Audience profile: ${audience} (${audienceProfile.levelHint}).`,
        `Difficulty framework: ${difficultyFramework}. Difficulty level: ${difficultyLevel}.`,
        `Vocabulary target: ${audienceProfile.vocabulary}.`,
        `Tone and personality: ${styleProfile}.`,
        `Keep the exchange natural and situational, not like a lecture.`,
        `Generate exactly 3 lines that fit the scenario and 3 ${target.instruction.phraseLabel}.`,
        jsonContract,
      ].join('\n')
    : [
        `You are ${character.name}, a ${target.englishName} tutor for ${audience} learners.`,
        target.instruction.outputRule,
        `Support explanations should stay compatible with ${support.englishName}.`,
        `Difficulty framework: ${difficultyFramework}. Difficulty level: ${difficultyLevel}.`,
        `Audience vocabulary target: ${audienceProfile.vocabulary}.`,
        `Audience topic focus: ${audienceProfile.topics}.`,
        `Tutor style: ${styleProfile}.`,
        `Scenario: ${scenarioText}.`,
        `Generate exactly 3 scenario-aware opening lines and 3 ${target.instruction.phraseLabel}.`,
        `Avoid generic fallback openings such as asking what the learner wants to discuss.`,
        jsonContract,
      ].join('\n');

  const userPrompt = isCustomScenario
    ? [
        `The user wants a natural conversation in ${target.englishName}.`,
        `Scenario: ${scenarioText}.`,
        `Difficulty: ${difficultyFramework} ${difficultyLevel}.`,
        `Make every line immediately usable in context.`,
      ].join('\n')
    : [
        `Create a tutor-led opening for this scenario in ${target.englishName}.`,
        `Scenario: ${scenarioText}.`,
        `Audience: ${audience}.`,
        `Difficulty: ${difficultyFramework} ${difficultyLevel}.`,
        `The lines must sound specific to the scenario, not generic.`,
      ].join('\n');

  return {
    systemPrompt,
    userPrompt,
    scenarioText,
    targetLanguageName: target.englishName,
  };
}
