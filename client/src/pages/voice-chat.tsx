// Voice-chat fallback page wired to the shared conversation session engine.
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useConversationSession } from '@/hooks/useConversationSession';
import { getPracticePageCopy } from '@/constants/uiCopy';
import { useAppStore } from '@/store/useAppStore';

export default function VoiceChat() {
  const { audience, character, scenario, targetLanguage, supportLanguage, uiLanguage, difficultyFramework, difficultyLevel } = useAppStore();
  const [textInput, setTextInput] = useState('');
  const copy = getPracticePageCopy(uiLanguage);
  const session = useConversationSession({
    scenarioId: scenario.presetKey || 'voice-practice',
    character: { name: character.name || copy.defaultTutorName, gender: character.gender, style: character.style },
    audience: audience || 'general',
    targetLanguage,
    supportLanguage,
    uiLanguage,
    difficultyFramework,
    difficultyLevel,
  });

  useEffect(() => {
    const run = async () => {
      try {
        await session.startSession();
      } catch {
        session.resetSession();
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="scene-bg min-h-screen p-4">
      <div className="mx-auto max-w-3xl space-y-3">
        <Card className="scene-card p-3 text-sm text-ivory-muted">{copy.voiceChatNotice}</Card>
        {session.history.map((item, idx) => (
          <Card key={`${item.speaker}-${idx}`} className="scene-card p-3">
            <p className="text-xs text-ivory-subtle">{item.speaker}</p>
            <p className="text-ivory">{item.text}</p>
          </Card>
        ))}
        <div className="flex gap-2">
          <input value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder={copy.inputPlaceholder} className="flex-1 rounded border border-scene-border bg-scene-surface p-2 text-ivory" />
          <Button onClick={() => session.sendTurn(textInput).then(() => setTextInput('')).catch(() => null)} disabled={session.isLoading}>{copy.send}</Button>
        </div>
      </div>
    </div>
  );
}
