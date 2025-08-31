import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { UsageLimitWarning } from "@/components/UsageLimitWarning";

export default function Home() {
  const { user } = useAuth();
  const { setCurrentPage, resetState } = useAppStore();

  const getSubscriptionBadge = () => {
    const tier = (user as any)?.subscriptionTier || 'free';
    switch (tier) {
      case 'starter':
        return <Badge variant="default" className="bg-green-500">스타터</Badge>;
      case 'pro':
        return <Badge variant="default" className="bg-purple-500">프로</Badge>;
      case 'premium':
        return <Badge variant="default" className="bg-blue-500">프리미엄</Badge>;
      default:
        return <Badge variant="secondary">무료</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              안녕하세요, {(user as any)?.firstName || '사용자'}님! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              오늘도 재미있는 영어 학습을 시작해보세요!
            </p>
          </div>
          <div className="flex items-center gap-4">
            {getSubscriptionBadge()}
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/api/logout'}
              data-testid="button-logout"
            >
              로그아웃
            </Button>
          </div>
        </div>

        {/* Usage Limit Warning */}
        <UsageLimitWarning />

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer" 
            data-testid="card-quick-start"
            onClick={() => {
              // 빠른시작: 새로운 학습 시작 (대상선택부터)
              resetState();
              setCurrentPage('home'); // AudienceSelection으로 이동
            }}
          >
            <CardHeader>
              <CardTitle className="text-lg">🚀 빠른 시작</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                새로운 대화 세션을 바로 시작하세요
              </CardDescription>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer" 
            data-testid="card-my-sessions"
            onClick={() => {
              setCurrentPage('playground'); // 이전 세션 보기/학습 시작
            }}
          >
            <CardHeader>
              <CardTitle className="text-lg">📚 내 세션</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                이전 대화 기록을 확인하세요
              </CardDescription>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer" 
            data-testid="card-progress"
            onClick={() => {
              setCurrentPage('playground'); // 학습 진도 확인
            }}
          >
            <CardHeader>
              <CardTitle className="text-lg">📊 학습 진도</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                나의 영어 실력 향상을 확인하세요
              </CardDescription>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer" 
            data-testid="card-subscription"
            onClick={() => setCurrentPage('subscription')}
          >
            <CardHeader>
              <CardTitle className="text-lg">💎 구독 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                요금제를 업그레이드하거나 관리하세요
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {((user as any)?.subscriptionTier || 'free') === 'free' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    🎯 더 많은 기능을 이용해보세요!
                  </h3>
                  <p className="text-blue-600 dark:text-blue-300 text-sm mb-3">
                    프리미엄 플랜으로 업그레이드하면 무제한 대화와 모든 시나리오를 이용할 수 있습니다.
                  </p>
                  <Button 
                    size="sm" 
                    data-testid="button-upgrade"
                    onClick={() => setCurrentPage('subscription')}
                  >
                    업그레이드 하기
                  </Button>
                </div>
              )}
              
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                아직 학습 기록이 없습니다. 첫 번째 대화를 시작해보세요! 🌟
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Overview */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎭 다양한 시나리오
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                비즈니스, 여행, 일상 등 실제 상황을 바탕으로 한 시나리오로 연습하세요.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🤖 AI 캐릭터
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                성격과 배경이 다른 AI 캐릭터들과 자연스러운 대화를 나누세요.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 실시간 피드백
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                발음과 문법을 실시간으로 분석하여 정확한 피드백을 받으세요.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}