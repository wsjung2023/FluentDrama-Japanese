// Scenario gallery page with metadata cards and collapsible custom scenario input.
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { SCENARIO_CONFIGS, type ScenarioId } from '@/constants/scenarios';

export default function Scenario() {
  const { audience, scenario, setScenario, setCurrentPage, setAudience } = useAppStore();
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<ScenarioId | undefined>(scenario.presetKey);

  const visibleScenarios = useMemo(
    () => Object.values(SCENARIO_CONFIGS).filter((item) => item.audience === 'all' || !audience || item.audience === audience),
    [audience],
  );

  const startPreset = (scenarioId: ScenarioId) => {
    const selected = SCENARIO_CONFIGS[scenarioId];
    try {
      setSelectedId(scenarioId);
      setScenario({ presetKey: scenarioId, freeText: '' });
      if (selected.audience !== 'all') {
        setAudience(selected.audience);
      }
      setCurrentPage('character');
    } catch {
      setCurrentPage('scenario');
    }
  };

  return (
    <div className="scene-bg min-h-screen rounded-2xl p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <h2 className="text-2xl font-bold text-ivory">어떤 장면으로 들어갈까요?</h2>
          <p className="text-sm text-ivory-muted">오늘 연습할 시나리오를 선택하세요.</p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleScenarios.map((item) => (
            <button
              key={item.id}
              onClick={() => startPreset(item.id)}
              className={`scene-card p-4 text-left transition ${selectedId === item.id ? 'border-gold bg-gold/5' : 'hover:border-gold/50'}`}
            >
              <div className="mb-3 flex items-start justify-between">
                <p className="text-2xl">{item.icon}</p>
                <span className="text-xs text-ivory-subtle">⏱ {item.estimatedMinutes}분</span>
              </div>
              <h3 className="text-lg font-semibold text-ivory">{item.title}</h3>
              <p className="mt-1 text-sm text-ivory-muted">{item.description}</p>
              <div className="mt-3 flex gap-2">
                <Badge className="bg-blue-500/20 text-blue-300">{item.level}</Badge>
                <Badge variant="secondary" className="bg-white/10 text-ivory-muted">{item.tone}</Badge>
              </div>
            </button>
          ))}
        </section>

        <Card className="scene-card">
          <CardHeader>
            <CardTitle className="text-ivory">커스텀 시나리오</CardTitle>
            <Button variant="ghost-gold" className="w-fit" onClick={() => setIsCustomOpen((prev) => !prev)}>
              {isCustomOpen ? '접기' : '직접 입력하기'}
            </Button>
          </CardHeader>
          {isCustomOpen && (
            <CardContent className="space-y-3">
              <Textarea
                value={scenario.freeText || ''}
                onChange={(event) => setScenario({ freeText: event.target.value, presetKey: undefined })}
                placeholder="또는 직접 시나리오를 입력해보세요..."
                className="min-h-32 bg-scene-surface text-ivory"
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    try {
                      setCurrentPage('character');
                    } catch {
                      setCurrentPage('scenario');
                    }
                  }}
                >
                  시작하기 →
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
