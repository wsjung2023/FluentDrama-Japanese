// Scene-first user home with daily recommendation, quick chips, and premium upsell.
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getLanguageDisplayName } from '@/constants/languages';
import { getHomeCopy, getHomeQuickChips, getTierLabel } from '@/constants/uiCopy';
import { DAILY_SCENES, getScenarioConfigMap, type ScenarioId } from '@/constants/scenarios';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore, type Audience } from '@/store/useAppStore';

export default function Home() {
  const { user } = useAuth();
  const { setCurrentPage, setAudience, setScenario, targetLanguage, uiLanguage } = useAppStore();
  const tier = user?.subscriptionTier || 'free';
  const homeCopy = getHomeCopy(uiLanguage);
  const quickChips = getHomeQuickChips(uiLanguage) as Array<{ label: string; scenarioId: ScenarioId; audience: Audience }>;
  const targetLanguageLabel = getLanguageDisplayName(targetLanguage);
  const tierLabel = getTierLabel(uiLanguage, tier);
  const scenarioConfigs = useMemo(() => getScenarioConfigMap(targetLanguage), [targetLanguage]);

  const todayScene = scenarioConfigs[DAILY_SCENES[new Date().getDay()]];

  const goScenario = (scenarioId: ScenarioId, audience: Audience) => {
    setAudience(audience);
    setScenario({ presetKey: scenarioId, freeText: '' });
    setCurrentPage('character');
  };

  return (
    <div className="scene-bg min-h-screen rounded-2xl bg-scene-hero p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-ivory">{homeCopy.greeting(user?.firstName || homeCopy.guestName)}</h1>
            <p className="text-sm text-ivory-muted">{homeCopy.prompt(targetLanguageLabel)}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{tier === 'free' ? homeCopy.freeTier : tierLabel}</Badge>
            <Button variant="ghost-gold" onClick={() => (window.location.href = '/api/logout')}>{homeCopy.logout}</Button>
          </div>
        </header>

        <Card className="scene-card border-white/10 bg-white/5">
          <CardHeader>
            <p className="text-sm text-gold">{homeCopy.todayRecommendation}</p>
            <CardTitle className="text-3xl tracking-tight text-ivory">{todayScene.icon} {todayScene.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-ivory-muted">{todayScene.description} · {todayScene.situation}</p>
            <Button onClick={() => goScenario(todayScene.id, (todayScene.audience === 'all' ? 'general' : todayScene.audience) as Audience)}>{homeCopy.startNow}</Button>
          </CardContent>
        </Card>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ivory-muted">{homeCopy.quickEntry}</p>
          <div className="flex flex-wrap gap-2">
            {quickChips.map((chip) => (
              <Button key={chip.label} variant="ghost-gold" className="rounded-full bg-white/10 hover:bg-white/20" onClick={() => goScenario(chip.scenarioId, chip.audience)}>
                {chip.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="scene-card">
            <CardHeader><CardTitle className="text-ivory">{homeCopy.continueSession}</CardTitle></CardHeader>
            <CardContent><Button variant="outline" onClick={() => setCurrentPage('playground')}>{homeCopy.openRecentConversation}</Button></CardContent>
          </Card>
          <Card className="scene-card">
            <CardHeader><CardTitle className="text-ivory">{homeCopy.reviewSavedExpressions}</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-ivory-muted">{homeCopy.reviewProgress(targetLanguageLabel)}</p></CardContent>
          </Card>
        </div>

        {tier === 'free' && (
          <Card className="scene-card border-gold/40 bg-gold/5">
            <CardHeader><CardTitle className="text-ivory">{homeCopy.premiumMode}</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <p className="text-sm text-ivory-muted">{homeCopy.premiumDescription}</p>
              <Button onClick={() => setCurrentPage('subscription')}>{homeCopy.upgrade}</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
