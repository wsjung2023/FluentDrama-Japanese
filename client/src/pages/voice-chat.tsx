// Voice-chat fallback page wired to the shared conversation session engine.
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useConversationSession } from '@/hooks/useConversationSession';
import { useAppStore } from '@/store/useAppStore';

export default function VoiceChat() {
  const { audience, character, scenario } = useAppStore();
  const [textInput, setTextInput] = useState('');
  const session = useConversationSession({
    scenarioId: scenario.presetKey || 'voice-practice',
    character: { name: character.name || '튜터', gender: character.gender, style: character.style },
    audience: audience || 'general',
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
        <Card className="scene-card p-3 text-sm text-ivory-muted">음성 인식은 추후 고도화 예정이며 현재는 텍스트 입력으로 동작합니다.</Card>
        {session.history.map((item, idx) => (
          <Card key={`${item.speaker}-${idx}`} className="scene-card p-3">
            <p className="text-xs text-ivory-subtle">{item.speaker}</p>
            <p className="text-ivory">{item.text}</p>
          </Card>
        ))}
        <div className="flex gap-2">
          <input value={textInput} onChange={(e) => setTextInput(e.target.value)} className="flex-1 rounded border border-scene-border bg-scene-surface p-2 text-ivory" />
          <Button onClick={() => session.sendTurn(textInput).then(() => setTextInput('')).catch(() => null)} disabled={session.isLoading}>보내기</Button>
        </div>
      </div>
    </div>
  );
}
