// Scenario gallery page with metadata cards and collapsible custom scenario input.
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { getScenarioCopy } from '@/constants/uiCopy';
import { getScenarioConfigMap, type ScenarioId } from '@/constants/scenarios';

export default function Scenario() {
  const { audience, scenario, targetLanguage, uiLanguage, setScenario, setCurrentPage, setAudience } = useAppStore();
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<ScenarioId | undefined>(scenario.presetKey);
  const scenarioCopy = getScenarioCopy(uiLanguage);
  const scenarioConfigs = useMemo(() => getScenarioConfigMap(targetLanguage), [targetLanguage]);

  const visibleScenarios = useMemo(
    () => Object.values(scenarioConfigs).filter((item) => item.audience === 'all' || !audience || item.audience === audience),
    [audience, scenarioConfigs],
  );

  const startPreset = (scenarioId: ScenarioId) => {
    const selected = scenarioConfigs[scenarioId];
    setSelectedId(scenarioId);
    setScenario({ presetKey: scenarioId, freeText: '' });
    if (selected.audience !== 'all') {
      setAudience(selected.audience);
    }
    setCurrentPage('character');
  };

  return (
    <div className="scene-bg min-h-screen rounded-2xl p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <h2 className="text-2xl font-bold text-ivory">{scenarioCopy.title}</h2>
          <p className="text-sm text-ivory-muted">{scenarioCopy.subtitle}</p>
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
                <span className="text-xs text-ivory-subtle">⏱ {scenarioCopy.durationMinutes(item.estimatedMinutes)}</span>
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
            <CardTitle className="text-ivory">{scenarioCopy.customScenario}</CardTitle>
            <Button variant="ghost-gold" className="w-fit" onClick={() => setIsCustomOpen((prev) => !prev)}>
              {isCustomOpen ? scenarioCopy.collapse : scenarioCopy.expand}
            </Button>
          </CardHeader>
          {isCustomOpen && (
            <CardContent className="space-y-3">
              <Textarea
                value={scenario.freeText || ''}
                onChange={(event) => setScenario({ freeText: event.target.value, presetKey: undefined })}
                placeholder={scenarioCopy.customPlaceholder}
                className="min-h-32 bg-scene-surface text-ivory"
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => setCurrentPage('character')}
                >
                  {scenarioCopy.start}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
