// Global Zustand store for audience, scenario, and conversation UI state.
import type { ScenarioId } from "@/constants/scenarios";
import {
  DEFAULT_DIFFICULTY_LEVEL,
  DEFAULT_LANGUAGE_CODE,
  DEFAULT_SUPPORT_LANGUAGE,
  DEFAULT_UI_LANGUAGE,
} from "@/constants/languages";
import type { DifficultyFramework, LanguageCode, RomanizationMode } from "@shared/language";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Audience = 'student' | 'general' | 'business';
export type Gender = 'male' | 'female';
export type Style = 'cheerful' | 'calm' | 'strict';

export interface Character {
  name: string;
  gender: Gender;
  style: Style;
  imageUrl?: string;
}

export interface Scenario {
  presetKey?: ScenarioId;
  freeText?: string;
}

export interface SubtitleSettings {
  enabled: boolean;
  showSupportTranslation: boolean;
  showRomanization: boolean;
  romanizationMode: RomanizationMode;
}

export interface AppState {
  // Navigation  
  currentPage: 'landing' | 'auth' | 'home' | 'character' | 'scenario' | 'playground' | 'user-home' | 'subscription' | 'admin' | 'terms' | 'privacy' | 'refund';
  
  // Learning State
  audience: Audience | null;
  targetLanguage: LanguageCode;
  supportLanguage: LanguageCode;
  uiLanguage: LanguageCode;
  difficultyFramework: DifficultyFramework;
  difficultyLevel: string;
  character: Character;
  scenario: Scenario;
  dialogue: string[];
  audioUrls: string[];
  focusPhrases: string[];
  subtitleSettings: SubtitleSettings;
  
  // UI State
  isLoading: boolean;
  loadingText: string;
  error: string | null;
  currentPlayingLine: number | null;
  
  // Actions
  setCurrentPage: (page: AppState['currentPage']) => void;
  setAudience: (audience: Audience) => void;
  setTargetLanguage: (language: LanguageCode) => void;
  setSupportLanguage: (language: LanguageCode) => void;
  setUiLanguage: (language: LanguageCode) => void;
  setDifficulty: (difficulty: { framework: DifficultyFramework; level: string }) => void;
  setCharacter: (character: Partial<Character>) => void;
  setScenario: (scenario: Partial<Scenario>) => void;
  setDialogue: (dialogue: string[]) => void;
  setAudioUrls: (urls: string[]) => void;
  setFocusPhrases: (phrases: string[]) => void;
  setLoading: (loading: boolean, text?: string) => void;
  setError: (error: string | null) => void;
  setCurrentPlayingLine: (line: number | null) => void;
  setSubtitleSettings: (settings: Partial<SubtitleSettings>) => void;
  resetState: () => void;
}

const initialState = {
  currentPage: 'landing' as const,
  audience: null,
  targetLanguage: DEFAULT_LANGUAGE_CODE,
  supportLanguage: DEFAULT_SUPPORT_LANGUAGE,
  uiLanguage: DEFAULT_UI_LANGUAGE,
  difficultyFramework: 'jlpt' as DifficultyFramework,
  difficultyLevel: DEFAULT_DIFFICULTY_LEVEL,
  character: {
    name: '',
    gender: 'female' as Gender,
    style: 'cheerful' as Style,
    imageUrl: undefined,
  },
  scenario: {
    presetKey: undefined,
    freeText: '',
  },
  dialogue: [],
  audioUrls: [],
  focusPhrases: [],
  subtitleSettings: {
    enabled: true,
    showSupportTranslation: true,
    showRomanization: true,
    romanizationMode: 'kana' as RomanizationMode,
  },
  isLoading: false,
  loadingText: '',
  error: null,
  currentPlayingLine: null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentPage: (page) => set({ currentPage: page }),
      
      setAudience: (audience) => set({ audience }),

      setTargetLanguage: (targetLanguage) => set({ targetLanguage }),

      setSupportLanguage: (supportLanguage) => set({ supportLanguage }),

      setUiLanguage: (uiLanguage) => set({ uiLanguage }),

      setDifficulty: ({ framework: difficultyFramework, level: difficultyLevel }) =>
        set({ difficultyFramework, difficultyLevel }),
      
      setCharacter: (character) => 
        set((state) => ({ 
          character: { ...state.character, ...character } 
        })),
      
      setScenario: (scenario) => 
        set((state) => ({ 
          scenario: { ...state.scenario, ...scenario } 
        })),
      
      setDialogue: (dialogue) => set({ dialogue }),
      
      setAudioUrls: (audioUrls) => set({ audioUrls }),
      
      setFocusPhrases: (focusPhrases) => set({ focusPhrases }),
      
      setLoading: (isLoading, loadingText = '') => 
        set({ isLoading, loadingText }),
      
      setError: (error) => set({ error }),
      
      setCurrentPlayingLine: (currentPlayingLine) => 
        set({ currentPlayingLine }),
      
      setSubtitleSettings: (settings) => 
        set((state) => ({ 
          subtitleSettings: { ...state.subtitleSettings, ...settings } 
        })),
      
      resetState: () => set(initialState),
    }),
    {
      name: 'fluent-drama-language-core-v2',
      partialize: (state) => ({
        audience: state.audience,
        targetLanguage: state.targetLanguage,
        supportLanguage: state.supportLanguage,
        uiLanguage: state.uiLanguage,
        difficultyFramework: state.difficultyFramework,
        difficultyLevel: state.difficultyLevel,
        character: state.character,
        scenario: state.scenario,
        dialogue: state.dialogue,
        audioUrls: state.audioUrls,
        focusPhrases: state.focusPhrases,
        subtitleSettings: state.subtitleSettings,
        currentPage: state.currentPage, // 현재 페이지도 저장
      }),
    }
  )
);
