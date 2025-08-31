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
  presetKey?: string;
  freeText?: string;
}

export interface SubtitleSettings {
  enabled: boolean;
  showKoreanTranslation: boolean;
  showPronunciation: boolean;
}

export interface AppState {
  // Navigation  
  currentPage: 'landing' | 'auth' | 'home' | 'character' | 'scenario' | 'playground' | 'user-home' | 'subscription' | 'admin';
  
  // Learning State
  audience: Audience | null;
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
    showKoreanTranslation: true,
    showPronunciation: true,
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
      name: 'ai-english-tutor-storage-v2',
      partialize: (state) => ({
        audience: state.audience,
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
