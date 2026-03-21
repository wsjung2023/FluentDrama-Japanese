import type { LanguageCode } from '@shared/language';
import {
  DEFAULT_DIFFICULTY_LEVEL,
  DEFAULT_LANGUAGE_CODE,
  DEFAULT_SUPPORT_LANGUAGE,
  DEFAULT_UI_LANGUAGE,
  LANGUAGE_CODES,
  LANGUAGE_METADATA,
} from '@shared/language';

export {
  DEFAULT_DIFFICULTY_LEVEL,
  DEFAULT_LANGUAGE_CODE,
  DEFAULT_SUPPORT_LANGUAGE,
  DEFAULT_UI_LANGUAGE,
  LANGUAGE_CODES,
  LANGUAGE_METADATA,
};

export type LanguageRolloutStage = 'phase2-live' | 'phase3-live' | 'phase3-in-progress' | 'phase3-planned';

export type LanguageCapability = {
  code: LanguageCode;
  targetSelectable: boolean;
  supportSelectable: boolean;
  uiSelectable: boolean;
  rolloutStage: LanguageRolloutStage;
};

export const LANGUAGE_CAPABILITIES: Record<LanguageCode, LanguageCapability> = {
  ja: { code: 'ja', targetSelectable: true, supportSelectable: true, uiSelectable: true, rolloutStage: 'phase2-live' },
  en: { code: 'en', targetSelectable: true, supportSelectable: true, uiSelectable: true, rolloutStage: 'phase2-live' },
  ko: { code: 'ko', targetSelectable: true, supportSelectable: true, uiSelectable: true, rolloutStage: 'phase3-live' },
  zh: { code: 'zh', targetSelectable: true, supportSelectable: true, uiSelectable: true, rolloutStage: 'phase3-live' },
  th: { code: 'th', targetSelectable: true, supportSelectable: true, uiSelectable: true, rolloutStage: 'phase3-live' },
  fr: { code: 'fr', targetSelectable: true, supportSelectable: true, uiSelectable: true, rolloutStage: 'phase3-live' },
  de: { code: 'de', targetSelectable: true, supportSelectable: true, uiSelectable: true, rolloutStage: 'phase3-live' },
  es: { code: 'es', targetSelectable: true, supportSelectable: true, uiSelectable: true, rolloutStage: 'phase3-live' },
  ar: { code: 'ar', targetSelectable: true, supportSelectable: true, uiSelectable: true, rolloutStage: 'phase3-live' },
  vi: { code: 'vi', targetSelectable: true, supportSelectable: true, uiSelectable: true, rolloutStage: 'phase3-live' },
};

export function getLanguageLabel(languageCode: keyof typeof LANGUAGE_METADATA) {
  const language = LANGUAGE_METADATA[languageCode];
  return `${language.nativeName} (${language.englishName})`;
}

export function getLanguageDisplayName(languageCode: keyof typeof LANGUAGE_METADATA) {
  return LANGUAGE_METADATA[languageCode].nativeName;
}

export function getSelectableLanguages(kind: 'target' | 'support' | 'ui'): LanguageCode[] {
  return LANGUAGE_CODES.filter((languageCode) => {
    const capability = LANGUAGE_CAPABILITIES[languageCode];
    if (kind === 'target') return capability.targetSelectable;
    if (kind === 'support') return capability.supportSelectable;
    return capability.uiSelectable;
  });
}
