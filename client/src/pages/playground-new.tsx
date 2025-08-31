import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Volume2, RotateCcw } from 'lucide-react';
import type { ConversationTurn } from '@shared/schema';

export default function InteractivePlayground() {
  const {
    audience,
    character,
    scenario,
    setCurrentPage,
  } = useAppStore();

  const { toast } = useToast();
  
  // Conversation state
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('Getting to know each other');
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Audio refs
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const getScenarioDescription = () => {
    if (scenario.freeText) return scenario.freeText;
    return currentTopic;
  };

  // Initialize conversation with character greeting
  useEffect(() => {
    if (character.name && conversationHistory.length === 0) {
      console.log('Starting conversation with character:', character.name);
      startConversation();
    }
  }, [character.name, conversationHistory.length]);

  const startConversation = async () => {
    const greeting = `Hello! I'm ${character.name}. I'm excited to practice English with you today. Let's start by talking about ${currentTopic.toLowerCase()}. How are you feeling today?`;
    
    const greetingTurn: ConversationTurn = {
      speaker: 'character',
      text: greeting,
      timestamp: Date.now()
    };

    // Generate TTS for greeting first
    try {
      console.log('Generating TTS for greeting...');
      const ttsResponse: any = await apiRequest('POST', '/api/tts', {
        text: greeting,
        voiceId: 'female_friendly'
      });
      
      greetingTurn.audioUrl = ttsResponse.audioUrl;
      setConversationHistory([greetingTurn]);
      
      // Automatically play the greeting when page loads
      setTimeout(() => {
        if (audioRef.current && ttsResponse.audioUrl) {
          audioRef.current.src = ttsResponse.audioUrl;
          audioRef.current.play().catch(e => console.log('Autoplay blocked:', e));
        }
      }, 1000);
      
    } catch (error) {
      console.error('Failed to generate greeting audio:', error);
      // Still add the greeting text even if TTS fails
      setConversationHistory([greetingTurn]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      
      // Set up audio visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      visualizeAudio();
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = processRecording;
      
      mediaRecorder.start();
      setIsListening(true);
      
      toast({
        title: "Listening...",
        description: "Speak now! I'm listening to your response.",
      });
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    setIsListening(false);
    setAudioLevel(0);
  };

  const visualizeAudio = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateLevel = () => {
      if (!analyserRef.current || !isListening) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(Math.min(100, (average / 255) * 100));
      
      requestAnimationFrame(updateLevel);
    };
    
    updateLevel();
  };

  const processRecording = async () => {
    setIsProcessing(true);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const audioData = base64Audio.split(',')[1]; // Remove data:audio/webm;base64, prefix
        
        let userText = '';
        
        try {
          // Speech recognition
          const speechResult: any = await apiRequest('POST', '/api/speech-recognition', {
            audioBlob: audioData,
            language: 'en'
          });
          
          userText = speechResult.text || '';
          
          if (!userText || !userText.trim()) {
            toast({
              title: "No speech detected",
              description: "I couldn't hear you clearly. Please try speaking again.",
              variant: "destructive",
            });
            setIsProcessing(false);
            return;
          }
          
          // Add user turn to conversation
          const userTurn: ConversationTurn = {
            speaker: 'user',
            text: userText,
            timestamp: Date.now()
          };
          
          setConversationHistory(prev => [...prev, userTurn]);
          
          // Generate character response
          console.log('Calling conversation response API...');
          try {
            const responseResult: any = await apiRequest('POST', '/api/conversation-response', {
              userInput: userText,
              conversationHistory: conversationHistory.map(turn => ({
                speaker: turn.speaker,
                text: turn.text
              })),
              character: {
                name: character.name,
                style: character.style
              },
              topic: currentTopic
            });
            
            console.log('Conversation response result:', responseResult);
            
            if (!responseResult || !responseResult.response) {
              throw new Error('No response received from character');
            }
            
            // Generate TTS for character response
            const ttsResponse: any = await apiRequest('POST', '/api/tts', {
              text: responseResult.response,
              voiceId: 'female_friendly'
            });
            
            const characterTurn: ConversationTurn = {
              speaker: 'character',
              text: responseResult.response,
              audioUrl: ttsResponse.audioUrl,
              timestamp: Date.now(),
              feedback: responseResult.feedback
            };
            
            setConversationHistory(prev => [...prev, characterTurn]);
            
            // Play character response
            if (audioRef.current && ttsResponse.audioUrl) {
              audioRef.current.src = ttsResponse.audioUrl;
              audioRef.current.play();
            }
            
            // Show feedback if provided
            if (responseResult.feedback) {
              const accuracy = responseResult.feedback.accuracy;
              let message = `Great job!`;
              if (accuracy < 70) {
                message = `Good effort! Let's keep practicing.`;
              } else if (accuracy < 85) {
                message = `Well done! You're improving.`;
              }
              
              toast({
                title: `Speaking Accuracy: ${accuracy}%`,
                description: message,
              });
            }
            
          } catch (conversationError) {
            console.error('Failed to generate character response:', conversationError);
            
            // Add a fallback response
            const fallbackTurn: ConversationTurn = {
              speaker: 'character',
              text: `I heard you say "${userText}". That's interesting! Could you tell me more about that?`,
              timestamp: Date.now()
            };
            setConversationHistory(prev => [...prev, fallbackTurn]);
            
            toast({
              title: "Character Response Error",
              description: "Using fallback response.",
              variant: "destructive",
            });
          }
          
        } catch (error) {
          console.error('Failed to process speech:', error);
          
          // Add user message anyway if we have text
          if (userText && userText.trim()) {
            const userTurn: ConversationTurn = {
              speaker: 'user',
              text: userText,
              timestamp: Date.now()
            };
            setConversationHistory(prev => [...prev, userTurn]);
            
            // Add a simple fallback response
            const fallbackTurn: ConversationTurn = {
              speaker: 'character',
              text: `I heard you say "${userText}". That's interesting! Could you tell me more about that?`,
              timestamp: Date.now()
            };
            setConversationHistory(prev => [...prev, fallbackTurn]);
          }
          
          toast({
            title: "Processing Error",
            description: `Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: "destructive",
          });
        }
      };
      
      reader.readAsDataURL(audioBlob);
      
    } catch (error) {
      console.error('Failed to process recording:', error);
      toast({
        title: "Error",
        description: "Failed to process recording. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetConversation = () => {
    setConversationHistory([]);
    setCurrentTopic('Getting to know each other');
    startConversation();
  };

  if (!character.name) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Character Setup Required</h2>
            <p className="text-gray-600 mb-6">Please create your character first to start the conversation.</p>
            <Button onClick={() => setCurrentPage('character')}>
              Create Character
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Speaking Practice</h1>
          <Button variant="outline" onClick={resetConversation}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
        <p className="text-gray-600">
          Practicing with {character.name} • Topic: {currentTopic}
        </p>
      </div>

      {/* Character Display */}
      <div className="mb-6">
        <Card>
          <CardContent className="p-6 text-center">
            {character.imageUrl && (
              <img 
                src={character.imageUrl} 
                alt={character.name}
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
              />
            )}
            <h3 className="text-xl font-semibold">{character.name}</h3>
            <p className="text-gray-600">{character.style} English tutor</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversation History */}
      <div className="mb-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Conversation</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {conversationHistory.map((turn, index) => (
                <div
                  key={index}
                  className={`flex ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      turn.speaker === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">
                      {turn.speaker === 'user' ? 'You' : character.name}
                    </p>
                    <p>{turn.text}</p>
                    {turn.audioUrl && turn.speaker === 'character' && (
                      <button
                        onClick={() => {
                          if (audioRef.current) {
                            audioRef.current.src = turn.audioUrl!;
                            audioRef.current.play();
                          }
                        }}
                        className="mt-2 text-xs opacity-70 hover:opacity-100 flex items-center"
                      >
                        <Volume2 className="w-3 h-3 mr-1" />
                        Play
                      </button>
                    )}
                    {turn.feedback && (
                      <div className="mt-2 text-xs opacity-80">
                        <p>Accuracy: {turn.feedback.accuracy}%</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recording Interface */}
      <div className="mb-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center text-white text-4xl font-bold transition-all duration-300 ${
                isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
              }`}>
                {isListening ? <MicOff /> : <Mic />}
              </div>
            </div>

            {isListening && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Listening... Speak now!</p>
                <Progress value={audioLevel} className="w-64 mx-auto" />
              </div>
            )}

            {isProcessing && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">Processing your speech...</p>
              </div>
            )}

            <div className="space-y-4">
              {!isListening && !isProcessing && (
                <Button
                  size="lg"
                  onClick={startRecording}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 text-lg font-semibold"
                >
                  <Mic className="w-6 h-6 mr-2" />
                  SPEAK NOW!
                </Button>
              )}

              {isListening && (
                <Button
                  size="lg"
                  onClick={stopRecording}
                  variant="destructive"
                  className="px-8 py-4 text-lg font-semibold"
                >
                  <MicOff className="w-6 h-6 mr-2" />
                  Stop Recording
                </Button>
              )}

              {isProcessing && (
                <Button size="lg" disabled className="px-8 py-4 text-lg font-semibold">
                  Processing...
                </Button>
              )}
            </div>

            <p className="text-sm text-gray-500 mt-4">
              Click "SPEAK NOW!" and have a natural conversation with {character.name}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hidden audio element for playback */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}