// SB AI Types
export interface SBAIConfig {
  openaiApiKey: string;
  supertoneApiKey?: string;
  imageGenerationModel: 'dall-e-3' | 'dall-e-2';
  ttsModel: 'tts-1' | 'tts-1-hd';
  chatModel: 'gpt-4o' | 'gpt-4' | 'gpt-3.5-turbo';
  fallbackTTS: boolean;
  appName: string;
}

export interface SBCharacter {
  id: string;
  name: string;
  gender: 'male' | 'female';
  personality: string;
  voice: string;
  imageUrl?: string;
  description?: string;
  background?: string;
}

export interface SBTTSRequest {
  text: string;
  voice?: string;
  model?: string;
  speed?: number;
}

export interface SBTTSResponse {
  success: boolean;
  audioUrl?: string;
  error?: string;
  provider: 'openai' | 'supertone' | 'browser';
}

export interface SBImageGenerationRequest {
  prompt: string;
  style?: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
}

export interface SBImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface SBConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  accuracy?: number;
}

export interface SBConversationContext {
  character: SBCharacter;
  scenario: string;
  language: 'en' | 'ko';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}