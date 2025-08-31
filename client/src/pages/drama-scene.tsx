import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest, safeJsonParse } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Volume2, RotateCcw, Play } from 'lucide-react';

interface ScenarioConfig {
  background: string;
  situation: string;
  userRole: string;
  characterRole: string;
  objective: string;
  expressions: string[];
}

const SCENARIOS: Record<string, ScenarioConfig> = {
  restaurant: {
    background: "linear-gradient(135deg, #8B4513 0%, #D2691E 50%, #CD853F 100%)",
    situation: "You're at an upscale restaurant",
    userRole: "Customer", 
    characterRole: "Restaurant Staff",
    objective: "Have a natural dining experience",
    expressions: []  // Remove hardcoded expressions
  },
  airport: {
    background: "linear-gradient(135deg, #87CEEB 0%, #4682B4 50%, #2F4F4F 100%)",
    situation: "You're checking in for an international business class flight",
    userRole: "Business Traveler",
    characterRole: "Flight Attendant",
    objective: "Complete check-in and receive premium service guidance",
    expressions: ["Welcome aboard, may I see your boarding pass?", "Would you like champagne or orange juice?", "Our meal service begins shortly", "Please let me know if you need anything"]
  },
  coffee_shop: {
    background: "linear-gradient(135deg, #8B4513 0%, #D2691E 50%, #654321 100%)",
    situation: "You're at a trendy local coffee shop meeting a friend",
    userRole: "Customer",
    characterRole: "Friendly Barista",
    objective: "Order specialty coffee and engage in casual conversation",
    expressions: ["Hey there! What can I craft for you today?", "That's our signature blend", "Would you like to try our new seasonal latte?", "Are you meeting someone special today?"]
  },
  business_meeting: {
    background: "linear-gradient(135deg, #2F4F4F 0%, #708090 50%, #B0C4DE 100%)",
    situation: "You're in a corporate meeting discussing a new project",
    userRole: "Project Manager",
    characterRole: "Senior Executive",
    objective: "Present ideas professionally and negotiate terms",
    expressions: ["Thank you for joining today's meeting", "What's your take on the market analysis?", "I'd like to propose an alternative approach", "When can we expect the deliverables?"]
  },
  hotel: {
    background: "linear-gradient(135deg, #DAA520 0%, #B8860B 50%, #8B7355 100%)",
    situation: "You're checking into a luxury hotel",
    userRole: "Hotel Guest",
    characterRole: "Concierge",
    objective: "Get personalized recommendations and luxury service",
    expressions: ["Welcome to our hotel, how was your journey?", "I'd be happy to arrange restaurant reservations", "Our spa services are highly recommended", "Is there anything special we can arrange for your stay?"]
  },
  // Additional scenarios for student audience
  cafeteria: {
    background: "linear-gradient(135deg, #87CEEB 0%, #98FB98 50%, #F0E68C 100%)",
    situation: "You're in the school cafeteria ordering lunch",
    userRole: "Student",
    characterRole: "Cafeteria Staff",
    objective: "Order lunch and practice casual conversation",
    expressions: ["What would you like for lunch today?", "Would you like fries with that?", "Here's your meal, enjoy!", "Have a great day!"]
  },
  club: {
    background: "linear-gradient(135deg, #FFB6C1 0%, #98FB98 50%, #87CEEB 100%)",
    situation: "You're joining a school club activity",
    userRole: "New Member",
    characterRole: "Club Leader",
    objective: "Introduce yourself and learn about club activities",
    expressions: ["Welcome to our club!", "What are you interested in?", "We meet every Tuesday", "Looking forward to working with you!"]
  }
};

interface DialogueTurn {
  speaker: 'character' | 'user' | 'system';
  text: string;
  audioUrl?: string;
  koreanTranslation?: string;
  pronunciation?: string;
  feedback?: {
    accuracy: number;
    pronunciation?: string;
    suggestions?: string[];
    needsCorrection?: boolean;
    koreanExplanation?: string;
    betterExpression?: string;
  };
  emotion?: 'neutral' | 'happy' | 'concerned' | 'professional';
}

export default function DramaScene() {
  const { character, scenario, audience, setCurrentPage, subtitleSettings } = useAppStore();
  const { toast } = useToast();
  
  // Scene state
  const [currentScenario, setCurrentScenario] = useState<ScenarioConfig | null>(null);
  const [dialogueHistory, setDialogueHistory] = useState<DialogueTurn[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [autoListenMode, setAutoListenMode] = useState(false);
  const [conversationEnded, setConversationEnded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedConversation, setRecordedConversation] = useState<string[]>([]);
  const [awaitingRetry, setAwaitingRetry] = useState(false);
  
  // Audio refs
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  useEffect(() => {
    console.log('Drama scene effect triggered:', { 
      characterName: character.name, 
      scenarioKey: scenario.presetKey,
      historyLength: dialogueHistory.length 
    });
    
    if (character.name && (scenario.presetKey || scenario.freeText?.trim()) && dialogueHistory.length === 0) {
      console.log('Initializing scene...');
      initializeScene();
    }
  }, [character.name, scenario.presetKey, scenario.freeText, dialogueHistory.length]);

  const initializeScene = () => {
    let scenarioConfig: ScenarioConfig;
    
    if (scenario.presetKey && SCENARIOS[scenario.presetKey]) {
      // 프리셋 시나리오 사용
      scenarioConfig = SCENARIOS[scenario.presetKey];
      console.log('Using preset scenario:', scenario.presetKey);
    } else if (scenario.freeText?.trim()) {
      // 커스텀 시나리오 생성
      scenarioConfig = {
        background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)",
        situation: scenario.freeText.trim(),
        userRole: "User",
        characterRole: "AI Tutor",
        objective: "Practice Japanese conversation in this custom scenario",
        expressions: []
      };
      console.log('Using custom scenario:', scenario.freeText);
    } else {
      // 폴백 - 일반적인 기본값
      scenarioConfig = {
        background: "linear-gradient(135deg, #6B7280 0%, #9CA3AF 50%, #D1D5DB 100%)",
        situation: "일반 일본어 회화 연습",
        userRole: "학습자",
        characterRole: "일본어 튜터",
        objective: "자연스러운 일본어 대화 연습",
        expressions: []
      };
      console.log('Using generic fallback scenario');
    }
    
    console.log('Final scenario config:', scenarioConfig);
    setCurrentScenario(scenarioConfig);
    
    // Start the scene with character introduction
    startScenario(scenarioConfig);
  };

  const startScenario = async (scenarioConfig: ScenarioConfig) => {
    console.log('Starting scenario with config:', scenarioConfig);
    
    try {
      console.log('Generating dynamic opening dialogue...');
      // Generate opening dialogue using AI instead of hardcoded text
      const dialogueResponseRaw = await apiRequest('POST', '/api/generate-dialogue', {
        audience: 'general', // or get from user settings
        character: {
          name: character.name,
          gender: character.gender,
          style: character.style
        },
        scenario: {
          presetKey: scenario.presetKey,
          freeText: scenario.freeText || scenarioConfig.situation
        }
      });
      
      const dialogueResponse = await safeJsonParse(dialogueResponseRaw);
      const openingLine = dialogueResponse.lines?.[0] || "こんにちは！今日はよろしくお願いします。";
      
      console.log('AI generated opening line:', openingLine);
      
      console.log('Calling TTS API...');
      // Generate character's opening dialogue with TTS
      const voiceId = getVoiceForCharacter(character.gender, character.style);
      console.log(`Using voice: ${voiceId} for ${character.gender} ${character.style}`);
      
      const ttsResponseRaw = await apiRequest('POST', '/api/tts', {
        text: openingLine,
        voiceId: voiceId,
        character: {
          style: character.style,
          gender: character.gender,
          role: scenarioConfig.characterRole
        },
        emotion: 'friendly'
      });
      
      const ttsResponse = await safeJsonParse(ttsResponseRaw);
      
      console.log('TTS Response received:', ttsResponse ? 'Success' : 'Failed');
      console.log('TTS full response:', ttsResponse);
      console.log('TTS audioUrl:', ttsResponse?.audioUrl ? 'Available' : 'Missing');
      
      // Generate translation and pronunciation - ALWAYS generate for debugging
      let koreanTranslation = '';
      let pronunciation = '';
      
      try {
        console.log('🔍 [OPENING] Requesting translation for:', openingLine);
        const translationResponseRaw = await apiRequest('POST', '/api/translate-pronunciation', {
          text: openingLine
        });
        const translationResponse = await translationResponseRaw.json();
        // Handle both direct response and nested response
        const responseData = translationResponse.data || translationResponse;
        
        koreanTranslation = responseData?.koreanTranslation || translationResponse?.koreanTranslation || '❌ API에서 빈 번역';
        pronunciation = responseData?.pronunciation || translationResponse?.pronunciation || '❌ API에서 빈 발음';
      } catch (error) {
        console.error('❌ [OPENING] Translation/pronunciation generation failed:', error);
        koreanTranslation = '❌ 첫 번째 번역 실패';
        pronunciation = '❌ 첫 번째 발음 실패';
      }
      
      console.log('🔍 [OPENING] Creating opening turn with translation:', koreanTranslation);
      
      const openingTurn: DialogueTurn = {
        speaker: 'character',
        text: openingLine,
        audioUrl: ttsResponse?.audioUrl,
        koreanTranslation: koreanTranslation || "🔥 강제 번역 텍스트",
        pronunciation: pronunciation || "🔥 강제 발음 텍스트",
        emotion: 'professional'
      };
      
      console.log('🔍 [OPENING] Final opening turn object:', openingTurn);
      
      // Add system message about the scenario
      const systemTurn: DialogueTurn = {
        speaker: 'system',
        text: `🎬 Scene: ${scenarioConfig?.situation || 'English practice'}\nYour role: ${scenarioConfig?.userRole || 'Student'}\n${character.name}'s role: ${scenarioConfig?.characterRole || 'Teacher'}`
      };
      
      console.log('Setting dialogue history...');
      setDialogueHistory([systemTurn, openingTurn]);
      setSceneProgress(10);
      
      // Auto-play opening line with fallback
      setTimeout(() => {
        if (ttsResponse?.audioUrl) {
          console.log('Playing TTS audio:', ttsResponse.audioUrl.substring(0, 50) + '...');
          playAudioWithFallback(openingLine, ttsResponse.audioUrl);
        } else {
          console.warn('No audio URL available, playing with browser TTS fallback');
          playAudioWithFallback(openingLine);
        }
        toast({
          title: `🎭 ${character.name} is speaking!`,
          description: "The scene has begun. Listen and respond when ready."
        });
      }, 1500);
      
    } catch (error) {
      console.error('Failed to start scenario:', error);
      toast({
        title: "Scene Setup Error",
        description: "Starting without audio. You can still practice the conversation!",
        variant: "destructive"
      });
      
      // Still create the dialogue even if TTS fails
      const fallbackOpeningLine = "こんにちは！今日はよろしくお願いします。";
      const openingTurn: DialogueTurn = {
        speaker: 'character',
        text: fallbackOpeningLine,
        emotion: 'professional'
      };
      
      const systemTurn: DialogueTurn = {
        speaker: 'system',
        text: `🎬 Scene: ${scenarioConfig?.situation || 'English practice'}\nYour role: ${scenarioConfig?.userRole || 'Student'}\n${character.name}'s role: ${scenarioConfig?.characterRole || 'Teacher'}`
      };
      
      setDialogueHistory([systemTurn, openingTurn]);
      setSceneProgress(10);
    }
  };

  // Remove hardcoded dialogue function - now using AI generation

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      
      // Audio visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      visualizeAudio();
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = processUserResponse;
      
      mediaRecorder.start();
      setIsListening(true);
      
    } catch (error) {
      console.error('Microphone error:', error);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to practice speaking.",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    console.log('🛑 Stop listening button clicked');
    
    if (mediaRecorderRef.current?.state === 'recording') {
      console.log('📱 Stopping media recorder...');
      mediaRecorderRef.current.stop();
    }
    
    streamRef.current?.getTracks().forEach(track => track.stop());
    audioContextRef.current?.close();
    
    setIsListening(false);
    setAudioLevel(0);
    
    console.log('✅ Stop listening completed');
  };

  const getVoiceForCharacter = (gender: string, style: string) => {
    console.log(`🎤 Selecting voice for gender: ${gender}, style: ${style}`);
    
    // 🎵 캐릭터 스타일에 따른 진짜 다양한 목소리 선택!
    if (gender === 'female') {
      if (style === 'cheerful') {
        console.log('🎤 Selected: shimmer (cheerful female)');
        return 'shimmer';  // 밝고 활기찬 여성
      }
      if (style === 'calm') {
        console.log('🎤 Selected: alloy (calm female)');
        return 'alloy';        // 차분하고 부드러운 여성
      }
      if (style === 'strict') {
        console.log('🎤 Selected: nova (strict female)');
        return 'nova';       // 전문적이고 명확한 여성
      }
      console.log('🎤 Selected: alloy (default female)');
      return 'alloy'; // 기본값
    } else {
      if (style === 'cheerful') {
        console.log('🎤 Selected: echo (cheerful male)');
        return 'echo';     // 밝고 친근한 남성
      }
      if (style === 'calm') {
        console.log('🎤 Selected: fable (calm male)');
        return 'fable';        // 차분하고 내레이션 스타일 남성
      }
      if (style === 'strict') {
        console.log('🎤 Selected: onyx (strict male)');
        return 'onyx';       // 깊고 전문적인 남성
      }
      console.log('🎤 Selected: fable (default male)');
      return 'fable'; // 기본값
    }
  };

  const visualizeAudio = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const animate = () => {
      if (!analyserRef.current || !isListening) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(Math.min(100, (average / 255) * 100));
      
      requestAnimationFrame(animate);
    };
    
    animate();
  };

  const processUserResponse = async () => {
    console.log('🎤 Processing user response...');
    setIsProcessing(true);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Check if audio blob is too small (likely just button click noise)
      if (audioBlob.size < 1000) {
        console.log('🔇 Audio blob too small, skipping processing:', audioBlob.size, 'bytes');
        setIsProcessing(false);
        return;
      }
      
      console.log('📊 Audio blob size:', audioBlob.size, 'bytes');
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];
          
          // Speech recognition - 일본어 음성 인식
          const speechResponseRaw = await apiRequest('POST', '/api/speech-recognition', {
            audioBlob: base64Audio,
            language: 'ja'  // 일본어 학습 앱이므로 일본어로 설정
          });
          
          const speechResponse = await safeJsonParse(speechResponseRaw);
          
          const userText = speechResponse.text?.trim() || '';
          
          if (!userText) {
            toast({
              title: "Didn't catch that",
              description: "Could you speak a bit louder and clearer?",
              variant: "destructive",
            });
            setIsProcessing(false);
            return;
          }
          
          // Add user response
          const userTurn: DialogueTurn = {
            speaker: 'user',
            text: userText
          };
          
          setDialogueHistory(prev => [...prev, userTurn]);
          
          // Record user input for session replay
          setRecordedConversation(prev => [...prev, `You: ${userText}`]);
          
          // Generate character's contextual response
          const contextualResponse = await generateContextualResponse(userText);
          
          // Check if correction is needed
          if (contextualResponse.feedback?.needsCorrection) {
            setAwaitingRetry(true);
            toast({
              title: "💬 표현 교정",
              description: contextualResponse.feedback.koreanExplanation || "다시 한번 말해보세요!",
              variant: "default",
            });
            
            // Don't add character response, wait for user to retry
            setIsProcessing(false);
            return;
          }
          
          // Record character response
          setRecordedConversation(prev => [...prev, `${character.name}: ${contextualResponse.text}`]);
          
          // Check if conversation should end
          if (contextualResponse.shouldEndConversation) {
            setConversationEnded(true);
            toast({
              title: "🎬 시나리오 완료",
              description: "대화가 자연스럽게 마무리되었습니다!",
            });
          }
          
          // Generate TTS for character response with character info
          const voiceId = getVoiceForCharacter(character.gender, character.style);
          const ttsResponseRaw = await apiRequest('POST', '/api/tts', {
            text: contextualResponse.text,
            voiceId: voiceId,
            character: {
              style: character.style,
              gender: character.gender,
              role: character.style
            },
            emotion: contextualResponse.emotion || 'friendly'
          });
          
          const ttsResponse = await safeJsonParse(ttsResponseRaw);
          
          // Generate translation and pronunciation - ALWAYS generate for debugging
          let koreanTranslation = '';
          let pronunciation = '';
          
          try {
            console.log('🔍 Requesting translation for:', contextualResponse.text);
            const translationResponseRaw = await apiRequest('POST', '/api/translate-pronunciation', {
              text: contextualResponse.text
            });
            const translationResponse = await safeJsonParse(translationResponseRaw);
            // Handle both direct response and nested response
            const responseData = translationResponse.data || translationResponse;
            
            koreanTranslation = responseData?.koreanTranslation || translationResponse?.koreanTranslation || '❌ 대화 API에서 빈 번역';
            pronunciation = responseData?.pronunciation || translationResponse?.pronunciation || '❌ 대화 API에서 빈 발음';
          } catch (error) {
            console.error('❌ Translation/pronunciation generation failed:', error);
            koreanTranslation = '❌ 번역 실패';
            pronunciation = '❌ 발음 실패';
          }
          
          console.log('🔍 Creating character response with translation:', koreanTranslation);
          
          const characterResponse: DialogueTurn = {
            speaker: 'character',
            text: contextualResponse.text,
            audioUrl: ttsResponse.audioUrl,
            koreanTranslation: koreanTranslation || "🔥 강제 대화 번역",
            pronunciation: pronunciation || "🔥 강제 대화 발음",
            feedback: contextualResponse.feedback,
            emotion: (contextualResponse.emotion as 'neutral' | 'happy' | 'concerned' | 'professional') || 'professional'
          };
          
          console.log('🔍 Adding to dialogue history:', characterResponse);
          setDialogueHistory(prev => {
            console.log('🔍 Previous dialogue history:', prev);
            const newHistory = [...prev, characterResponse];
            console.log('🔍 New dialogue history:', newHistory);
            return newHistory;
          });
          setSceneProgress(prev => Math.min(prev + 15, 100));
          
          // Play character response with fallback
          setTimeout(() => {
            playAudioWithFallback(contextualResponse.text, ttsResponse?.audioUrl);
          }, 500);
          
          // Show feedback with better expression suggestions
          if (contextualResponse.feedback && !contextualResponse.feedback.needsCorrection) {
            const { accuracy, betterExpression } = contextualResponse.feedback;
            
            if (betterExpression) {
              toast({
                title: `💡 더 자연스러운 표현 (${accuracy}점)`,
                description: `"${betterExpression}" 이렇게 말하면 더 좋아요!`,
              });
            } else if (accuracy >= 90) {
              toast({
                title: "✨ 완벽해요!",
                description: `정확도 ${accuracy}% - 훌륭한 표현입니다!`,
              });
            }
          }
          
          setAwaitingRetry(false);
          
        } catch (error) {
          console.error('Processing error:', error);
          toast({
            title: "Scene Error",
            description: "Something went wrong during the scene. Let's continue!",
            variant: "destructive",
          });
        }
      };
      
      reader.readAsDataURL(audioBlob);
      
    } catch (error) {
      console.error('Recording processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateContextualResponse = async (userInput: string) => {
    try {
      // Handle Korean custom scenarios
      const scenarioContext = currentScenario ? 
        `${currentScenario.situation}` : 
        scenario.freeText || 'English conversation practice';
      
      const characterRole = currentScenario?.characterRole || 'English conversation partner';
      const userRole = currentScenario?.userRole || 'English learner';
      
      const prompt = `You are ${character.name}, playing the role of ${characterRole} in this scenario: "${scenarioContext}"

The user (${userRole}) just said: "${userInput}"

Please respond naturally as the ${characterRole} would, advancing the conversation. Also provide helpful feedback.

If the user's expression could be improved, suggest a more natural or appropriate alternative.

Respond in JSON format:
{
  "text": "Your natural response as the character (in English)",
  "feedback": {
    "accuracy": 85,
    "pronunciation": "good", 
    "suggestions": ["Helpful tips for improvement"],
    "betterExpression": "A more natural alternative expression"
  },
  "emotion": "professional"
}`;

      const responseRaw = await apiRequest('POST', '/api/conversation-response', {
        userInput,
        conversationHistory: dialogueHistory.map(turn => ({
          speaker: turn.speaker,
          text: turn.text
        })),
        character: {
          name: character.name,
          style: character.style
        },
        topic: currentScenario?.situation || "English conversation"
      });
      
      const response = await safeJsonParse(responseRaw);
      console.log('Generated response:', response.response);
      
      return {
        text: response.response || "That's interesting! Please continue.",
        feedback: response.feedback || { accuracy: 80, pronunciation: 'good', suggestions: [] },
        emotion: 'professional',
        shouldEndConversation: response.shouldEndConversation || false
      };
      
    } catch (error) {
      console.error('Failed to generate contextual response:', error);
      return {
        text: "I see! Please tell me more about that.",
        feedback: { accuracy: 75, pronunciation: 'good', suggestions: ['Keep practicing!'] },
        emotion: 'neutral'
      };
    }
  };

  const playAudioWithFallback = (text: string, audioUrl?: string) => {
    // Only use OpenAI TTS - no browser TTS fallback
    if (audioUrl && audioRef.current) {
      console.log('Playing OpenAI TTS audio');
      audioRef.current.src = audioUrl;
      audioRef.current.oncanplaythrough = () => {
        audioRef.current?.play()
          .then(() => {
            console.log('OpenAI TTS audio played successfully');
          })
          .catch(error => {
            console.error('OpenAI TTS audio playback failed:', error);
            toast({
              title: "Audio Error",
              description: "Failed to play audio",
              variant: "destructive"
            });
          });
      };
      audioRef.current.onerror = (error) => {
        console.error('Audio loading error:', error);
        toast({
          title: "Audio Error", 
          description: "Failed to load audio",
          variant: "destructive"
        });
      };
      // Start loading the audio
      audioRef.current.load();
    } else {
      console.warn('No audio URL provided - skipping audio playback');
      // No toast notification for missing audio to avoid spam
    }
  };

  // Browser TTS completely removed - only OpenAI TTS is used

  const playAudio = (turn: DialogueTurn) => {
    playAudioWithFallback(turn.text, turn.audioUrl);
  };

  const startContinuousListening = async () => {
    if (!autoListenMode) return;
    
    try {
      await startListening();
    } catch (error) {
      console.error('Auto listen failed:', error);
      setAutoListenMode(false);
    }
  };

  // Auto-listen after character finishes speaking
  useEffect(() => {
    if (autoListenMode && dialogueHistory.length > 0) {
      const lastTurn = dialogueHistory[dialogueHistory.length - 1];
      if (lastTurn.speaker === 'character' && !isListening && !isProcessing) {
        // Start listening 2 seconds after character finishes
        const timeout = setTimeout(() => {
          if (autoListenMode && !isListening && !isProcessing) {
            startListening();
          }
        }, 2000);
        
        return () => clearTimeout(timeout);
      }
    }
  }, [dialogueHistory, autoListenMode, isListening, isProcessing]);

  const resetScene = () => {
    setDialogueHistory([]);
    setSceneProgress(0);
    setAutoListenMode(false);
    if (currentScenario) {
      startScenario(currentScenario);
    }
  };

  if (!character.name || (!scenario.presetKey && !scenario.freeText?.trim())) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Setup Required</h2>
            <p className="text-gray-600 mb-6">Please create your character and select a scenario first.</p>
            <div className="space-x-4">
              <Button onClick={() => setCurrentPage('character')}>
                Create Character
              </Button>
              <Button onClick={() => setCurrentPage('scenario')} variant="outline">
                Choose Scenario
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentScenario) {
    return <div className="flex items-center justify-center h-screen">Loading scene...</div>;
  }

  return (
    <div 
      className="min-h-screen relative"
      style={{ 
        background: currentScenario.background,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      
      <div className="relative z-10 px-4 py-2 h-screen flex flex-col max-w-md mx-auto">
        {/* Mobile Scene Header */}
        <div className="bg-black bg-opacity-60 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-3">
            {character.imageUrl && (
              <div className="relative">
                <img 
                  src={character.imageUrl} 
                  alt={character.name}
                  className="w-16 h-20 rounded-lg object-cover object-top border-2 border-white shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-white text-lg font-bold">{character.name}</h1>
              <p className="text-gray-300 text-xs">{currentScenario.characterRole}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-gray-400 text-xs">{currentScenario.situation}</span>
                <div className="text-right">
                  <Progress value={sceneProgress} className="w-20 h-1 mb-1" />
                  <p className="text-white text-xs">{sceneProgress}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Chat History */}
        <div className="flex-1 overflow-y-auto mb-3 space-y-2">
          {dialogueHistory.map((turn, index) => {
            // Create unique key to prevent duplicate rendering
            const uniqueKey = `${turn.speaker}-${index}-${turn.text?.substring(0, 10) || 'empty'}`;
            return (
              <div key={uniqueKey}>
              {turn.speaker === 'system' && (
                <div className="bg-blue-900 bg-opacity-70 rounded-lg p-2 mx-4">
                  <pre className="text-white text-xs whitespace-pre-wrap text-center">{turn.text}</pre>
                </div>
              )}
              
              {turn.speaker === 'character' && (
                <div className="flex items-start gap-2">
                  <img 
                    src={character.imageUrl} 
                    alt={character.name}
                    className="w-8 h-10 rounded object-cover object-top border border-purple-300"
                  />
                  <div className="flex-1 max-w-xs">
                    <div className="bg-white bg-opacity-95 rounded-lg p-3 shadow-sm">
                      <p className="text-gray-800 text-sm">{turn.text}</p>
                      {turn.speaker === 'character' && (
                        <div className="mt-2 space-y-1">
                          {/* Korean translation */}
                          {turn.koreanTranslation && (
                            <div className="text-sm text-white bg-blue-600 rounded px-3 py-2">
                              🇰🇷 한국어: {turn.koreanTranslation}
                            </div>
                          )}
                          
                          {/* Pronunciation */}
                          {turn.pronunciation && (
                            <div className="text-sm text-white bg-green-600 rounded px-3 py-2">
                              🔊 발음: {turn.pronunciation}
                            </div>
                          )}
                        </div>
                      )}
                      {turn.audioUrl && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => playAudio(turn)}
                          className="mt-1 p-1 h-6 text-purple-600"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Replay
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {turn.speaker === 'user' && (
                <div className="flex items-start gap-2 justify-end">
                  <div className="flex-1 max-w-xs">
                    <div className="bg-blue-500 text-white rounded-lg p-3 ml-8">
                      <p className="text-sm">{turn.text}</p>
                      {turn.feedback && (
                        <div className="mt-1 text-xs text-blue-100">
                          Score: {turn.feedback.accuracy}%
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">You</span>
                  </div>
                </div>
              )}
              </div>
            );
          })}
        </div>

        {/* Mobile Voice Input */}
        <div className="bg-black bg-opacity-60 rounded-lg p-3">
          {isListening && (
            <div className="mb-3 text-center">
              <p className="text-white text-xs mb-2">🎤 Listening... Speak clearly!</p>
              <Progress value={audioLevel} className="w-full h-2" />
            </div>
          )}

          {isProcessing && (
            <div className="mb-3 text-center">
              <p className="text-white text-xs">🎭 Processing...</p>
            </div>
          )}

          <div className="flex justify-center gap-2 flex-wrap">
            {!conversationEnded && !isListening && !isProcessing && (
              <>
                <Button
                  size="sm"
                  onClick={startListening}
                  className={`rounded-full px-4 py-2 ${awaitingRetry ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                >
                  <Mic className="w-4 h-4 mr-1" />
                  {awaitingRetry ? "다시 말하기" : "ACTION"}
                </Button>
                
                <Button
                  size="sm"
                  onClick={() => {
                    // 대화 기록에서 캐릭터 대사들 추출
                    const characterLines = dialogueHistory
                      .filter(turn => turn.speaker === 'character')
                      .map(turn => turn.text)
                      .slice(0, 5); // 최근 5개 대사만
                    
                    if (characterLines.length > 0) {
                      toast({
                        title: "📝 대화 대본",
                        description: characterLines.join(" • "),
                      });
                    } else {
                      // 대화가 시작되기 전이라면 시나리오 정보 표시
                      const script = currentScenario?.expressions || [];
                      if (script.length > 0) {
                        toast({
                          title: "📝 예제 표현",
                          description: script.join(" • "),
                        });
                      } else {
                        toast({
                          title: "📝 시나리오 정보",
                          description: currentScenario?.situation || "현재 시나리오에 대한 정보입니다",
                        });
                      }
                    }
                  }}
                  variant="secondary"
                  className="rounded-full px-3 py-2"
                >
                  📝 Script
                </Button>
                
                <Button
                  size="sm"
                  onClick={() => {
                    setIsRecording(!isRecording);
                    toast({
                      title: isRecording ? "🔴 녹음 시작" : "⏹️ 녹음 중지",
                      description: isRecording ? "대화가 녹음됩니다" : "녹음이 중지되었습니다",
                    });
                  }}
                  variant={isRecording ? "destructive" : "outline"}
                  className="rounded-full px-3 py-2"
                >
                  {isRecording ? "🔴" : "⚫"} 녹음
                </Button>
              </>
            )}

            {conversationEnded && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={resetScene}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-full px-4 py-2"
                >
                  🔄 다시 시작
                </Button>
                
                <Button
                  size="sm"
                  onClick={() => {
                    const conversation = recordedConversation.join('\n');
                    toast({
                      title: "📝 대화 기록",
                      description: `${recordedConversation.length}개의 대화가 기록되었습니다`,
                    });
                    console.log("Full conversation:", conversation);
                  }}
                  variant="secondary"
                  className="rounded-full px-3 py-2"
                >
                  📝 대화보기
                </Button>
              </div>
            )}

            {isListening && (
              <Button
                size="sm"
                onClick={stopListening}
                variant="destructive"
                className="rounded-full px-4 py-2"
              >
                <MicOff className="w-4 h-4 mr-1" />
                Stop
              </Button>
            )}

            {isProcessing && (
              <Button size="sm" disabled className="rounded-full px-4 py-2">
                {awaitingRetry ? "교정 중..." : "Processing..."}
              </Button>
            )}
          </div>

          <div className="text-center mt-2">
            {conversationEnded ? (
              <p className="text-green-400 text-xs">
                🎬 시나리오 완료! 총 {recordedConversation.length}개의 대화 교환
              </p>
            ) : awaitingRetry ? (
              <p className="text-orange-400 text-xs">
                💬 표현을 교정했습니다. 다시 말해보세요!
              </p>
            ) : (
              <p className="text-white text-xs">
                🎭 You: {currentScenario.userRole} | {character.name}: {currentScenario.characterRole}
              </p>
            )}
          </div>
        </div>

        {/* Audio element with controls for debugging */}
        <audio 
          ref={audioRef} 
          controls={false}
          preload="auto"
          onError={(e) => console.error('Audio element error:', e)}
          onCanPlay={() => console.log('Audio can play')}
          onPlay={() => console.log('Audio started playing')}
          onPause={() => console.log('Audio paused')}
        />
        
        {/* Debug audio player - remove this later */}
        <div className="fixed bottom-2 left-2 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
          <div>Audio Debug</div>
          {dialogueHistory.filter(d => d.audioUrl).length > 0 && (
            <audio 
              controls 
              src={dialogueHistory.filter(d => d.audioUrl)[0]?.audioUrl}
              className="w-32 h-6"
            />
          )}
        </div>
      </div>
    </div>
  );
}