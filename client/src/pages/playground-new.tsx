// Lightweight playground page that uses the shared conversation session hook.
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useConversationSession } from '@/hooks/useConversationSession';
import { useAppStore } from '@/store/useAppStore';

export default function PlaygroundNew() {
  const { audience, character, scenario } = useAppStore();
  const [draft, setDraft] = useState('');
  const session = useConversationSession({
    scenarioId: scenario.presetKey || 'free-talk',
    character: { name: character.name || '튜터', gender: character.gender, style: character.style },
    audience: audience || 'general',
    difficulty: 'beginner',
  });

  useEffect(() => {
    const init = async () => {
      try {
        await session.startSession();
      } catch {
        session.resetSession();
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="scene-bg min-h-screen p-4">
      <div className="mx-auto max-w-3xl space-y-3">
        {session.history.map((item, idx) => (
          <Card key={`${item.speaker}-${idx}`} className="scene-card p-3">
            <p className="text-xs text-ivory-subtle">{item.speaker}</p>
            <p className="text-ivory">{item.text}</p>
          </Card>
        ))}
        <div className="flex gap-2">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} className="flex-1 rounded border border-scene-border bg-scene-surface p-2 text-ivory" />
          <Button onClick={() => session.sendTurn(draft).then(() => setDraft('')).catch(() => null)} disabled={session.isLoading}>전송</Button>
        </div>
      </div>
    </div>
  );
}
