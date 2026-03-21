import type { LanguageCode } from '@shared/language';

export type ScenarioId =
  | 'cafeteria'
  | 'club'
  | 'homework'
  | 'school_trip'
  | 'new_friend'
  | 'confidence_talk'
  | 'travel'
  | 'cafe_order'
  | 'job_interview'
  | 'roommate_chat'
  | 'hobby_club'
  | 'presentation_basics'
  | 'email_etiquette'
  | 'meeting_opener'
  | 'negotiation_basics'
  | 'small_talk'
  | 'deadline_followup'
  | 'presentation_qa';

export type ScenarioAudience = 'student' | 'general' | 'business' | 'all';
export type ScenarioDifficultyLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'TOPIK1' | 'TOPIK2' | 'TOPIK3' | 'TOPIK4' | 'TOPIK5' | 'TOPIK6';
export type ScenarioTone =
  | '캐주얼'
  | '공손체'
  | '존댓말'
  | '비즈니스'
  | 'Casual'
  | 'Polite'
  | 'Business'
  | 'カジュアル'
  | '丁寧'
  | 'ビジネス';

export interface ScenarioCore {
  id: ScenarioId;
  icon: string;
  audience: ScenarioAudience;
  estimatedMinutes: number;
  background: string;
  defaultLanguage: LanguageCode;
}

export const SCENARIO_CORE: Record<ScenarioId, ScenarioCore> = {
  cafeteria: { id: 'cafeteria', icon: '🍱', audience: 'student', estimatedMinutes: 8, background: 'linear-gradient(135deg, #3D3D3D 0%, #515151 100%)', defaultLanguage: 'ja' },
  club: { id: 'club', icon: '🎸', audience: 'student', estimatedMinutes: 10, background: 'linear-gradient(135deg, #3B2A52 0%, #221F3B 100%)', defaultLanguage: 'ja' },
  homework: { id: 'homework', icon: '📚', audience: 'student', estimatedMinutes: 9, background: 'linear-gradient(135deg, #354F52 0%, #52796F 100%)', defaultLanguage: 'ja' },
  school_trip: { id: 'school_trip', icon: '🗺️', audience: 'student', estimatedMinutes: 12, background: 'linear-gradient(135deg, #1D3557 0%, #457B9D 100%)', defaultLanguage: 'ja' },
  new_friend: { id: 'new_friend', icon: '🤝', audience: 'student', estimatedMinutes: 7, background: 'linear-gradient(135deg, #2D6A4F 0%, #40916C 100%)', defaultLanguage: 'ja' },
  confidence_talk: { id: 'confidence_talk', icon: '🎤', audience: 'student', estimatedMinutes: 11, background: 'linear-gradient(135deg, #264653 0%, #2A9D8F 100%)', defaultLanguage: 'ja' },
  travel: { id: 'travel', icon: '🛫', audience: 'general', estimatedMinutes: 12, background: 'linear-gradient(135deg, #1D3557 0%, #457B9D 100%)', defaultLanguage: 'ja' },
  cafe_order: { id: 'cafe_order', icon: '☕', audience: 'general', estimatedMinutes: 8, background: 'linear-gradient(135deg, #6F4E37 0%, #A67B5B 100%)', defaultLanguage: 'ja' },
  job_interview: { id: 'job_interview', icon: '🧳', audience: 'general', estimatedMinutes: 14, background: 'linear-gradient(135deg, #3A506B 0%, #5BC0BE 100%)', defaultLanguage: 'ja' },
  roommate_chat: { id: 'roommate_chat', icon: '🏠', audience: 'general', estimatedMinutes: 9, background: 'linear-gradient(135deg, #3A3D40 0%, #586F7C 100%)', defaultLanguage: 'ja' },
  hobby_club: { id: 'hobby_club', icon: '🎨', audience: 'general', estimatedMinutes: 10, background: 'linear-gradient(135deg, #334E68 0%, #627D98 100%)', defaultLanguage: 'ja' },
  presentation_basics: { id: 'presentation_basics', icon: '📊', audience: 'general', estimatedMinutes: 13, background: 'linear-gradient(135deg, #1F2937 0%, #374151 100%)', defaultLanguage: 'ja' },
  email_etiquette: { id: 'email_etiquette', icon: '📧', audience: 'business', estimatedMinutes: 12, background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)', defaultLanguage: 'ja' },
  meeting_opener: { id: 'meeting_opener', icon: '🧑‍💼', audience: 'business', estimatedMinutes: 14, background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', defaultLanguage: 'ja' },
  negotiation_basics: { id: 'negotiation_basics', icon: '📈', audience: 'business', estimatedMinutes: 15, background: 'linear-gradient(135deg, #172554 0%, #1E3A8A 100%)', defaultLanguage: 'ja' },
  small_talk: { id: 'small_talk', icon: '💬', audience: 'business', estimatedMinutes: 10, background: 'linear-gradient(135deg, #3F3CBB 0%, #1D2671 100%)', defaultLanguage: 'ja' },
  deadline_followup: { id: 'deadline_followup', icon: '⏱️', audience: 'business', estimatedMinutes: 13, background: 'linear-gradient(135deg, #312E81 0%, #4338CA 100%)', defaultLanguage: 'ja' },
  presentation_qa: { id: 'presentation_qa', icon: '❓', audience: 'business', estimatedMinutes: 16, background: 'linear-gradient(135deg, #111827 0%, #374151 100%)', defaultLanguage: 'ja' },
};

export const DAILY_SCENES: ScenarioId[] = ['travel', 'cafe_order', 'meeting_opener', 'cafeteria', 'small_talk', 'club', 'negotiation_basics'];
