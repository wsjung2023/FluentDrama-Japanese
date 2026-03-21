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
import { getDramaSceneCopy } from '@/constants/uiCopy';
import { getScenarioConfigMap } from '@/constants/scenarios';
import { useAppStore } from '@/store/useAppStore';

type UiMessage = {
  id: string;
  speaker: 'assistant' | 'user';
  text: string;
  supportTranslation?: string;
  pronunciation?: string;
  feedback?: Feedback;
};

function qualityLabel(feedback: Feedback | undefined, copy: ReturnType<typeof getDramaSceneCopy>) {
  const accuracy = feedback?.accuracy ?? 0;
  if (accuracy >= 90) return { label: copy.qualityNatural, className: 'quality-natural' };
  if (accuracy >= 75) return { label: copy.qualityClear, className: 'quality-clear' };
  if (accuracy >= 60) return { label: copy.qualityAwkward, className: 'quality-awkward' };
  return { label: copy.qualityRetry, className: 'quality-retry' };
}

export default function DramaScene() {
  const { toast } = useToast();
  const {
    audience,
    character,
    scenario,
    subtitleSettings,
    supportLanguage,
    targetLanguage,
    uiLanguage,
    difficultyFramework,
    difficultyLevel,
    setSubtitleSettings,
    setCurrentPage,
  } = useAppStore();
  const copy = getDramaSceneCopy(uiLanguage);
  const scenarioConfigs = useMemo(() => getScenarioConfigMap(targetLanguage), [targetLanguage]);
  const activeScenario = scenario.presetKey ? scenarioConfigs[scenario.presetKey] : undefined;

  const conversation = useConversationSession({
    scenarioId: activeScenario?.id || 'custom-scene',
    character: { name: character.name || copy.defaultTutorName, gender: character.gender, style: character.style },
    audience: audience ?? 'general',
    difficulty: 'beginner',
    targetLanguage,
    supportLanguage,
    uiLanguage,
    difficultyFramework,
    difficultyLevel,
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
        toast({ title: copy.startFailedTitle, description: copy.startFailedDescription, variant: 'destructive' });
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
      title: copy.sessionErrorTitle,
      description: conversation.error,
      variant: 'destructive',
    });
  }, [conversation.error, copy.sessionErrorTitle, toast]);

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
          supportTranslation: assistant.supportTranslation,
          pronunciation: assistant.pronunciation,
          feedback: assistant.feedback,
        },
      ]);
    } catch {
      setMessages((prev) => prev.filter((message) => message.id !== userMessageId));
      toast({ title: copy.responseFailedTitle, description: copy.responseFailedDescription, variant: 'destructive' });
    }
  };

  const replayLastAssistant = () => {
    const last = [...messages].reverse().find((item) => item.speaker === 'assistant');
    if (!last) return;
    const utter = new SpeechSynthesisUtterance(last.text);
    utter.lang = targetLanguage === 'ja' ? 'ja-JP' : targetLanguage;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const recorder = usePressToRecord({
    language: targetLanguage,
    onTranscript: async (transcript) => {
      await sendInput(transcript);
    },
    onError: (message) => {
      toast({ title: copy.voiceInputErrorTitle, description: message, variant: 'destructive' });
    },
  });

  return (
    <div className="scene-bg flex min-h-screen flex-col rounded-2xl">
      <header className="sticky top-0 z-10 border-b border-scene-border bg-scene-bg/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
          <Button variant="ghost-gold" size="icon" onClick={() => setCurrentPage('scenario')}><ArrowLeft /></Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ivory-muted">{activeScenario?.title || copy.customScene}</p>
            <Progress value={progress} className="mt-2 h-1" />
          </div>
          <Button variant="ghost-gold" size="icon" onClick={() => setShowSettings((prev) => !prev)}><Settings /></Button>
        </div>
        {showSettings && (
          <Card className="scene-card mx-auto mt-3 w-full max-w-5xl p-3">
            <div className="flex items-center justify-between text-sm text-ivory">
              <span>{supportLanguage === 'ko' ? copy.supportTranslationKo : copy.supportTranslationGeneric}</span>
              <Switch checked={subtitleSettings.showSupportTranslation} onCheckedChange={(value) => setSubtitleSettings({ showSupportTranslation: value, enabled: true })} />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-ivory">
              <span>{copy.romanization}</span>
              <Switch checked={subtitleSettings.showRomanization} onCheckedChange={(value) => setSubtitleSettings({ showRomanization: value, enabled: true })} />
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
              {message.speaker === 'assistant' && subtitleSettings.showSupportTranslation && message.supportTranslation && (
                <p className="mt-2 text-sm text-ivory-muted">{copy.supportTranslationLabel}: {message.supportTranslation}</p>
              )}
              {message.speaker === 'assistant' && subtitleSettings.showRomanization && message.pronunciation && (
                <p className="mt-1 text-xs text-ivory-subtle">{copy.pronunciationLabel}: {message.pronunciation}</p>
              )}
              {message.speaker === 'user' && messages[index + 1]?.feedback && (
                <div className="mt-3 rounded-lg border border-scene-border bg-black/20 p-2 text-sm">
                  {(() => {
                    const nextFeedback = messages[index + 1]?.feedback;
                    const score = qualityLabel(nextFeedback, copy);
                    return (
                      <>
                        <p className={score.className}>✨ {score.label}</p>
                        {nextFeedback?.explanation && <p className="mt-1 text-ivory-muted">{nextFeedback.explanationLabel || copy.explanation}: {nextFeedback.explanation}</p>}
                        {nextFeedback?.correction && <p className="mt-1 text-ivory-muted">{copy.correction}: {nextFeedback.correction}</p>}
                        {nextFeedback?.betterExpression && <p className="text-ivory-muted">{copy.betterExpression}: {nextFeedback.betterExpression}</p>}
                        {nextFeedback?.suggestions && nextFeedback.suggestions.length > 0 && (
                          <p className="text-ivory-muted">{copy.tips}: {nextFeedback.suggestions.join(' · ')}</p>
                        )}
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
            onClick={() => setSubtitleSettings({ showSupportTranslation: !subtitleSettings.showSupportTranslation, enabled: true })}
          >
            <Eye />
          </Button>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && !event.shiftKey && (event.preventDefault(), sendInput(draft))}
            className="flex-1 rounded-md border border-scene-border bg-scene-surface px-3 py-2 text-sm text-ivory outline-none"
            placeholder={targetLanguage === 'ja' ? copy.inputPlaceholderJa : copy.inputPlaceholderGeneric}
          />
          <Button disabled={conversation.isLoading || recorder.isProcessing} onClick={() => sendInput(draft)}>{copy.send}</Button>
        </div>
        {recorder.isRecording && <p className="mx-auto mt-2 max-w-5xl text-xs text-gold">{copy.recording}</p>}
        {recorder.isProcessing && <p className="mx-auto mt-2 max-w-5xl text-xs text-ivory-muted">{copy.processingVoice}</p>}
        {showHints && (
          <div className="mx-auto mt-2 max-w-5xl rounded-md border border-scene-border bg-scene-surface p-2 text-sm text-ivory-muted">
            {activeScenario?.expressions?.join(' · ') || copy.hintFallback}
          </div>
        )}
      </footer>
    </div>
  );
}
