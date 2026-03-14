// Immersive drama scene page with unified conversation hook and 3-zone layout.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Eye, Lightbulb, Mic, RotateCcw, Settings, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useConversationSession, type Feedback } from '@/hooks/useConversationSession';
import { usePressToRecord } from '@/hooks/usePressToRecord';
import { SCENARIO_CONFIGS } from '@/constants/scenarios';
import { useAppStore } from '@/store/useAppStore';

type UiMessage = {
  id: string;
  speaker: 'assistant' | 'user';
  text: string;
  koreanTranslation?: string;
  pronunciation?: string;
  feedback?: Feedback;
};

function qualityLabel(feedback?: Feedback) {
  const accuracy = feedback?.accuracy ?? 0;
  if (accuracy >= 90) return { label: 'Natural', className: 'quality-natural' };
  if (accuracy >= 75) return { label: 'Clear', className: 'quality-clear' };
  if (accuracy >= 60) return { label: 'Slightly awkward', className: 'quality-awkward' };
  return { label: 'Try this', className: 'quality-retry' };
}

export default function DramaScene() {
  const { toast } = useToast();
  const {
    audience,
    character,
    scenario,
    subtitleSettings,
    setSubtitleSettings,
    setCurrentPage,
  } = useAppStore();
  const activeScenario = scenario.presetKey ? SCENARIO_CONFIGS[scenario.presetKey] : undefined;

  const conversation = useConversationSession({
    scenarioId: activeScenario?.id || 'custom-scene',
    character: { name: character.name || '튜터', gender: character.gender, style: character.style },
    audience: audience ?? 'general',
    difficulty: 'beginner',
  });

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const progress = useMemo(() => Math.min(100, Math.round((messages.length / 20) * 100)), [messages.length]);

  useEffect(() => {
    const start = async () => {
      try {
        const started = await conversation.startSession();
        setMessages([{ id: 'opening', speaker: 'assistant', text: started.openingMessage.text }]);
      } catch {
        toast({ title: '시작 실패', description: '세션을 시작하지 못했습니다.', variant: 'destructive' });
      }
    };
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!conversation.error) return;
    toast({
      title: '세션 오류',
      description: conversation.error,
      variant: 'destructive',
    });
  }, [conversation.error, toast]);

  const sendInput = async (text: string) => {
    const normalized = text.trim();
    if (!normalized || conversation.isLoading) return;

    const userMessageId = `u-${Date.now()}`;
    const userMessage: UiMessage = { id: userMessageId, speaker: 'user', text: normalized };
    setMessages((prev) => [...prev, userMessage]);
    setDraft('');

    try {
      const assistant = await conversation.sendTurn(normalized);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          speaker: 'assistant',
          text: assistant.text,
          koreanTranslation: assistant.koreanTranslation,
          pronunciation: assistant.pronunciation,
          feedback: assistant.feedback,
        },
      ]);
    } catch {
      setMessages((prev) => prev.filter((message) => message.id !== userMessageId));
      toast({ title: '응답 실패', description: '잠시 후 다시 시도해주세요.', variant: 'destructive' });
    }
  };

  const replayLastAssistant = () => {
    const last = [...messages].reverse().find((item) => item.speaker === 'assistant');
    if (!last) return;
    const utter = new SpeechSynthesisUtterance(last.text);
    utter.lang = 'ja-JP';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const recorder = usePressToRecord({
    language: 'ja',
    onTranscript: async (transcript) => {
      await sendInput(transcript);
    },
    onError: (message) => {
      toast({ title: '음성 입력 오류', description: message, variant: 'destructive' });
    },
  });

  return (
    <div className="scene-bg flex min-h-screen flex-col rounded-2xl">
      <header className="sticky top-0 z-10 border-b border-scene-border bg-scene-bg/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
          <Button variant="ghost-gold" size="icon" onClick={() => setCurrentPage('scenario')}><ArrowLeft /></Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ivory-muted">{activeScenario?.title || '커스텀 장면'}</p>
            <Progress value={progress} className="mt-2 h-1" />
          </div>
          <Button variant="ghost-gold" size="icon" onClick={() => setShowSettings((prev) => !prev)}><Settings /></Button>
        </div>
        {showSettings && (
          <Card className="scene-card mx-auto mt-3 w-full max-w-5xl p-3">
            <div className="flex items-center justify-between text-sm text-ivory">
              <span>한국어 번역 표시</span>
              <Switch checked={subtitleSettings.showKoreanTranslation} onCheckedChange={(value) => setSubtitleSettings({ showKoreanTranslation: value, enabled: true })} />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-ivory">
              <span>발음 표시</span>
              <Switch checked={subtitleSettings.showPronunciation} onCheckedChange={(value) => setSubtitleSettings({ showPronunciation: value, enabled: true })} />
            </div>
          </Card>
        )}
      </header>

      <main ref={listRef} className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {messages.map((message, index) => (
          <div key={message.id} className={message.speaker === 'assistant' ? 'self-start' : 'self-end'}>
            <Card className={`scene-card max-w-2xl p-3 ${message.speaker === 'user' ? 'bg-gold/10' : 'bg-scene-surface'}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="jp-text text-lg text-ivory">{message.text}</p>
                {message.speaker === 'assistant' && (
                  <Button variant="ghost-gold" size="icon" onClick={replayLastAssistant}><Volume2 className="h-4 w-4" /></Button>
                )}
              </div>
              {message.speaker === 'assistant' && subtitleSettings.showKoreanTranslation && message.koreanTranslation && (
                <p className="mt-2 text-sm text-ivory-muted">韓: {message.koreanTranslation}</p>
              )}
              {message.speaker === 'assistant' && subtitleSettings.showPronunciation && message.pronunciation && (
                <p className="mt-1 text-xs text-ivory-subtle">読み: {message.pronunciation}</p>
              )}
              {message.speaker === 'user' && messages[index + 1]?.feedback && (
                <div className="mt-3 rounded-lg border border-scene-border bg-black/20 p-2 text-sm">
                  {(() => {
                    const score = qualityLabel(messages[index + 1].feedback);
                    return (
                      <>
                        <p className={score.className}>✨ {score.label}</p>
                        {messages[index + 1].feedback?.correction && <p className="mt-1 text-ivory-muted">교정: {messages[index + 1].feedback?.correction}</p>}
                        {messages[index + 1].feedback?.betterExpression && <p className="text-ivory-muted">더 자연스럽게: {messages[index + 1].feedback?.betterExpression}</p>}
                      </>
                    );
                  })()}
                </div>
              )}
            </Card>
          </div>
        ))}
      </main>

      <footer className="sticky bottom-0 border-t border-scene-border bg-scene-bg/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-2">
          <Button variant="ghost-gold" size="icon" onClick={() => setShowHints((prev) => !prev)}><Lightbulb /></Button>
          <Button variant="ghost-gold" size="icon" onClick={replayLastAssistant}><RotateCcw /></Button>
          <Button
            variant="scene-action"
            onMouseDown={() => recorder.startRecording()}
            onMouseUp={() => recorder.stopRecording()}
            onMouseLeave={() => recorder.stopRecording()}
            onTouchStart={() => recorder.startRecording()}
            onTouchEnd={() => recorder.stopRecording()}
            disabled={recorder.isProcessing}
          >
            <Mic className={recorder.isRecording ? 'text-red-400' : ''} />
          </Button>
          <Button
            variant="ghost-gold"
            size="icon"
            onClick={() => setSubtitleSettings({ showKoreanTranslation: !subtitleSettings.showKoreanTranslation, enabled: true })}
          >
            <Eye />
          </Button>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && !event.shiftKey && (event.preventDefault(), sendInput(draft))}
            className="flex-1 rounded-md border border-scene-border bg-scene-surface px-3 py-2 text-sm text-ivory outline-none"
            placeholder="일본어로 말해보세요..."
          />
          <Button disabled={conversation.isLoading || recorder.isProcessing} onClick={() => sendInput(draft)}>전송</Button>
        </div>
        {recorder.isRecording && <p className="mx-auto mt-2 max-w-5xl text-xs text-gold">녹음 중... 버튼에서 손을 떼면 전송됩니다.</p>}
        {recorder.isProcessing && <p className="mx-auto mt-2 max-w-5xl text-xs text-ivory-muted">음성을 인식하는 중입니다...</p>}
        {showHints && (
          <div className="mx-auto mt-2 max-w-5xl rounded-md border border-scene-border bg-scene-surface p-2 text-sm text-ivory-muted">
            {activeScenario?.expressions?.join(' · ') || '상황에 맞는 인사와 요청 표현을 먼저 말해보세요.'}
          </div>
        )}
      </footer>
    </div>
  );
}
