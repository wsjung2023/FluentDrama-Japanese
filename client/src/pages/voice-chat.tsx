import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { apiRequest, safeJsonParse } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Volume2, RotateCcw, MessageCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  speaker: 'user' | 'character';
  text: string;
  audioUrl?: string;
  timestamp: number;
  accuracy?: number;
  koreanTranslation?: string;
  pronunciation?: string;
}

interface ConversationStartResponse {
  sessionId: string;
  initialPrompt: string;
  scenario: {
    title: string;
    context: string;
  };
  message: string;
}

interface ConversationTurnResponse {
  response: string;
  feedback?: {
    accuracy?: number;
    pronunciation?: string;
  };
  subtitle?: {
    ko?: string;
    yomigana?: string;
  };
  message: string;
}

export default function VoiceChat() {
  const { character, setCurrentPage, subtitleSettings } = useAppStore();
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (character.name && messages.length === 0) {
      initializeChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.name]);

  const initializeChat = async () => {
    try {
      const startResponse = (await safeJsonParse(await apiRequest('POST', '/api/conversation/start', {
        scenarioId: 'daily-conversation',
        difficulty: 'beginner',
        characterId: character.name,
        userGoal: '자연스러운 일본어 회화 연습',
      }))) as ConversationStartResponse;

      setSessionId(startResponse.sessionId);

      const initialMessage: ChatMessage = {
        id: `character-${Date.now()}`,
        speaker: 'character',
        text: startResponse.initialPrompt,
        timestamp: Date.now(),
      };

      setMessages([initialMessage]);

      try {
        const ttsResponse = (await safeJsonParse(await apiRequest('POST', '/api/tts', {
          text: startResponse.initialPrompt,
          voiceId: 'female_friendly',
        }))) as { audioUrl?: string };

        if (ttsResponse.audioUrl) {
          setMessages((prev) => prev.map((msg) => msg.id === initialMessage.id ? { ...msg, audioUrl: ttsResponse.audioUrl } : msg));
          if (audioRef.current) {
            audioRef.current.src = ttsResponse.audioUrl;
            audioRef.current.play().catch(console.error);
          }
        }
      } catch (ttsError) {
        console.error('Initial prompt TTS failed:', ttsError);
      }
    } catch (error) {
      console.error('Failed to start conversation session:', error);
      toast({
        title: 'Session Error',
        description: '대화 세션을 시작하지 못했습니다. 다시 시도해주세요.',
        variant: 'destructive',
      });
    }
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

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

      mediaRecorder.onstop = handleRecordingComplete;

      mediaRecorder.start();
      setIsListening(true);

      toast({
        title: 'Listening...',
        description: "I'm listening! Speak naturally.",
      });
    } catch (error) {
      console.error('Microphone error:', error);
      toast({
        title: 'Microphone Error',
        description: 'Cannot access microphone. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    audioContextRef.current?.close();

    setIsListening(false);
    setAudioLevel(0);
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

  const handleRecordingComplete = async () => {
    setIsProcessing(true);

    try {
      if (!sessionId) {
        toast({
          title: 'Session Missing',
          description: '세션이 초기화되지 않았습니다. 다시 시작해주세요.',
          variant: 'destructive',
        });
        return;
      }

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];

          const speechResponse = (await safeJsonParse(await apiRequest('POST', '/api/speech-recognition', {
            audioBlob: base64Audio,
            language: 'ja',
          }))) as { text?: string };

          const userText = speechResponse.text?.trim() || '';

          if (!userText) {
            toast({
              title: "Didn't catch that",
              description: 'Could you try speaking again?',
              variant: 'destructive',
            });
            return;
          }

          const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            speaker: 'user',
            text: userText,
            timestamp: Date.now(),
          };

          const nextMessages = [...messages, userMessage];
          setMessages(nextMessages);

          const conversationResponse = (await safeJsonParse(await apiRequest('POST', '/api/conversation/turn', {
            sessionId,
            userInput: userText,
            history: nextMessages.map((msg) => ({
              speaker: msg.speaker === 'character' ? 'assistant' : 'user',
              text: msg.text,
            })),
          }))) as ConversationTurnResponse;

          const responseText = conversationResponse.response || 'それは面白いですね！もっと聞かせてください。';

          const ttsResponse = (await safeJsonParse(await apiRequest('POST', '/api/tts', {
            text: responseText,
            voiceId: 'female_friendly',
          }))) as { audioUrl?: string };

          const characterMessage: ChatMessage = {
            id: `character-${Date.now()}`,
            speaker: 'character',
            text: responseText,
            audioUrl: ttsResponse.audioUrl,
            timestamp: Date.now(),
            accuracy: conversationResponse.feedback?.accuracy,
            koreanTranslation: conversationResponse.subtitle?.ko || '',
            pronunciation: conversationResponse.feedback?.pronunciation || conversationResponse.subtitle?.yomigana || '',
          };

          setMessages((prev) => [...prev, characterMessage]);

          if (audioRef.current && ttsResponse.audioUrl) {
            audioRef.current.src = ttsResponse.audioUrl;
            audioRef.current.play();
          }

          if (conversationResponse.feedback?.accuracy) {
            const accuracy = conversationResponse.feedback.accuracy;
            toast({
              title: `Speaking Score: ${accuracy}%`,
              description: accuracy > 85 ? 'Excellent!' : accuracy > 70 ? 'Good job!' : 'Keep practicing!',
            });
          }
        } catch (error) {
          console.error('Processing error:', error);
          toast({
            title: 'Processing Error',
            description: "Sorry, I couldn't process that. Try again?",
            variant: 'destructive',
          });
        }
      };

      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Recording processing failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to process recording.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const playMessage = (message: ChatMessage) => {
    if (message.audioUrl && audioRef.current) {
      audioRef.current.src = message.audioUrl;
      audioRef.current.play();
    }
  };

  const resetChat = () => {
    setMessages([]);
    setSessionId(null);
    initializeChat();
  };

  if (!character.name) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold mb-4">Create Your Tutor</h2>
            <p className="text-gray-600 mb-6">먼저 일본어 튜터를 생성하여 대화를 시작해보세요!</p>
            <Button onClick={() => setCurrentPage('character')}>Create Tutor</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-2xl h-screen flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          {character.imageUrl && (
            <img src={character.imageUrl} alt={character.name} className="w-10 h-10 rounded-full object-cover" />
          )}
          <div>
            <h1 className="font-semibold">{character.name}</h1>
            <p className="text-sm text-gray-500">Japanese Conversation Tutor</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={resetChat}>
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs px-4 py-3 rounded-2xl ${
                message.speaker === 'user'
                  ? 'bg-blue-500 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-800 rounded-bl-md'
              }`}
            >
              <p className="text-sm">{message.text}</p>

              {message.speaker === 'character' && subtitleSettings.enabled && (
                <div className="mt-2 space-y-1">
                  {subtitleSettings.showKoreanTranslation && message.koreanTranslation && (
                    <p className="text-xs text-gray-600 bg-white bg-opacity-50 rounded px-2 py-1">
                      🇰🇷 {message.koreanTranslation}
                    </p>
                  )}
                  {subtitleSettings.showPronunciation && message.pronunciation && (
                    <p className="text-xs text-gray-500 italic">🔊 {message.pronunciation}</p>
                  )}
                </div>
              )}

              {message.audioUrl && message.speaker === 'character' && (
                <button onClick={() => playMessage(message)} className="mt-2 flex items-center text-xs opacity-70 hover:opacity-100">
                  <Volume2 className="w-3 h-3 mr-1" />
                  Play
                </button>
              )}
              {message.accuracy && <div className="mt-2 text-xs opacity-80">Score: {message.accuracy}%</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        {isListening && (
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-600 mb-2">Listening... Speak now!</p>
            <Progress value={audioLevel} className="w-full max-w-xs mx-auto" />
          </div>
        )}

        {isProcessing && (
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-600">Processing your speech...</p>
          </div>
        )}

        <div className="flex justify-center">
          {!isListening && !isProcessing && (
            <Button
              size="lg"
              onClick={startListening}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-8 py-4"
            >
              <Mic className="w-5 h-5 mr-2" />
              SPEAK NOW!
            </Button>
          )}

          {isListening && (
            <Button size="lg" onClick={stopListening} variant="destructive" className="rounded-full px-8 py-4">
              <MicOff className="w-5 h-5 mr-2" />
              Stop
            </Button>
          )}

          {isProcessing && (
            <Button size="lg" disabled className="rounded-full px-8 py-4">
              Processing...
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-gray-500 mt-3">Tap to speak naturally with {character.name}</p>
      </div>

      <audio ref={audioRef} />
    </div>
  );
}
