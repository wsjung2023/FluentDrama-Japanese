import { z } from 'zod';

export const LANGUAGE_CODES = ['ja', 'en', 'ko', 'zh', 'th', 'fr', 'de', 'es', 'ar', 'vi'] as const;
export type LanguageCode = (typeof LANGUAGE_CODES)[number];
export const languageCodeSchema = z.enum(LANGUAGE_CODES);

export const DIFFICULTY_FRAMEWORKS = ['jlpt', 'cefr', 'hsk', 'topik', 'custom'] as const;
export type DifficultyFramework = (typeof DIFFICULTY_FRAMEWORKS)[number];
export const difficultyFrameworkSchema = z.enum(DIFFICULTY_FRAMEWORKS);

export const ROMANIZATION_MODES = ['native', 'latin', 'kana', 'ipa', 'none'] as const;
export type RomanizationMode = (typeof ROMANIZATION_MODES)[number];
export const romanizationModeSchema = z.enum(ROMANIZATION_MODES);

export type LanguageMetadata = {
  code: LanguageCode;
  englishName: string;
  nativeName: string;
  defaultSupportLanguage: LanguageCode;
  defaultDifficultyFramework: DifficultyFramework;
  defaultRomanizationMode: RomanizationMode;
  isRtl: boolean;
};

export const LANGUAGE_METADATA: Record<LanguageCode, LanguageMetadata> = {
  ja: {
    code: 'ja',
    englishName: 'Japanese',
    nativeName: '日本語',
    defaultSupportLanguage: 'ko',
    defaultDifficultyFramework: 'jlpt',
    defaultRomanizationMode: 'kana',
    isRtl: false,
  },
  en: {
    code: 'en',
    englishName: 'English',
    nativeName: 'English',
    defaultSupportLanguage: 'ko',
    defaultDifficultyFramework: 'cefr',
    defaultRomanizationMode: 'none',
    isRtl: false,
  },
  ko: {
    code: 'ko',
    englishName: 'Korean',
    nativeName: '한국어',
    defaultSupportLanguage: 'en',
    defaultDifficultyFramework: 'topik',
    defaultRomanizationMode: 'none',
    isRtl: false,
  },
  zh: {
    code: 'zh',
    englishName: 'Chinese',
    nativeName: '中文',
    defaultSupportLanguage: 'en',
    defaultDifficultyFramework: 'hsk',
    defaultRomanizationMode: 'latin',
    isRtl: false,
  },
  th: {
    code: 'th',
    englishName: 'Thai',
    nativeName: 'ไทย',
    defaultSupportLanguage: 'en',
    defaultDifficultyFramework: 'custom',
    defaultRomanizationMode: 'latin',
    isRtl: false,
  },
  fr: {
    code: 'fr',
    englishName: 'French',
    nativeName: 'Français',
    defaultSupportLanguage: 'en',
    defaultDifficultyFramework: 'cefr',
    defaultRomanizationMode: 'none',
    isRtl: false,
  },
  de: {
    code: 'de',
    englishName: 'German',
    nativeName: 'Deutsch',
    defaultSupportLanguage: 'en',
    defaultDifficultyFramework: 'cefr',
    defaultRomanizationMode: 'none',
    isRtl: false,
  },
  es: {
    code: 'es',
    englishName: 'Spanish',
    nativeName: 'Español',
    defaultSupportLanguage: 'en',
    defaultDifficultyFramework: 'cefr',
    defaultRomanizationMode: 'none',
    isRtl: false,
  },
  ar: {
    code: 'ar',
    englishName: 'Arabic',
    nativeName: 'العربية',
    defaultSupportLanguage: 'en',
    defaultDifficultyFramework: 'custom',
    defaultRomanizationMode: 'latin',
    isRtl: true,
  },
  vi: {
    code: 'vi',
    englishName: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    defaultSupportLanguage: 'en',
    defaultDifficultyFramework: 'custom',
    defaultRomanizationMode: 'none',
    isRtl: false,
  },
};

export const DEFAULT_LANGUAGE_CODE: LanguageCode = 'ja';
export const DEFAULT_UI_LANGUAGE: LanguageCode = 'ko';
export const DEFAULT_SUPPORT_LANGUAGE: LanguageCode = 'ko';
export const DEFAULT_DIFFICULTY_LEVEL = 'N5';
