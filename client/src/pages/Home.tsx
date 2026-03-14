// Scene-first user home with daily recommendation, quick chips, and premium upsell.
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DAILY_SCENES, SCENARIO_CONFIGS, type ScenarioId } from '@/constants/scenarios';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore, type Audience } from '@/store/useAppStore';

const QUICK_CHIPS: Array<{ label: string; scenarioId: ScenarioId; audience: Audience }> = [
  { label: '여행', scenarioId: 'travel', audience: 'general' },
  { label: '카페', scenarioId: 'cafe_order', audience: 'general' },
  { label: '학교', scenarioId: 'cafeteria', audience: 'student' },
  { label: '비즈니스', scenarioId: 'meeting_opener', audience: 'business' },
  { label: '자유대화', scenarioId: 'roommate_chat', audience: 'general' },
];

export default function Home() {
  const { user } = useAuth();
  const { setCurrentPage, setAudience, setScenario } = useAppStore();
  const tier = ((user as any)?.subscriptionTier || 'free') as string;

  const todayScene = SCENARIO_CONFIGS[DAILY_SCENES[new Date().getDay()]];

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
            <h1 className="text-3xl font-bold text-ivory">안녕하세요, {(user as any)?.firstName || '사용자'}님</h1>
            <p className="text-sm text-ivory-muted">오늘 어떤 일본어 장면을 연습해볼까요?</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{tier === 'free' ? '무료' : tier}</Badge>
            <Button variant="ghost-gold" onClick={() => (window.location.href = '/api/logout')}>로그아웃</Button>
          </div>
        </header>

        <Card className="scene-card border-white/10 bg-white/5">
          <CardHeader>
            <p className="text-sm text-gold">오늘의 추천 장면</p>
            <CardTitle className="text-3xl tracking-tight text-ivory">{todayScene.icon} {todayScene.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-ivory-muted">{todayScene.description} · {todayScene.situation}</p>
            <Button onClick={() => goScenario(todayScene.id, (todayScene.audience === 'all' ? 'general' : todayScene.audience) as Audience)}>바로 시작하기</Button>
          </CardContent>
        </Card>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ivory-muted">빠른 입장</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_CHIPS.map((chip) => (
              <Button key={chip.label} variant="ghost-gold" className="rounded-full bg-white/10 hover:bg-white/20" onClick={() => goScenario(chip.scenarioId, chip.audience)}>
                {chip.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="scene-card">
            <CardHeader><CardTitle className="text-ivory">이전 세션 이어하기</CardTitle></CardHeader>
            <CardContent><Button variant="outline" onClick={() => setCurrentPage('playground')}>최근 대화 열기</Button></CardContent>
          </Card>
          <Card className="scene-card">
            <CardHeader><CardTitle className="text-ivory">저장된 표현 복습</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-ivory-muted">나의 일본어 학습 진도를 확인하세요.</p></CardContent>
          </Card>
        </div>

        {tier === 'free' && (
          <Card className="scene-card border-gold/40 bg-gold/5">
            <CardHeader><CardTitle className="text-ivory">프리미엄 학습 모드</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <p className="text-sm text-ivory-muted">무제한 대화, 심화 피드백, 고급 시나리오를 이용해보세요.</p>
              <Button onClick={() => setCurrentPage('subscription')}>업그레이드</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
