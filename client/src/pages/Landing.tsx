import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";

export default function Landing() {
  const { setCurrentPage } = useAppStore();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">🎭 AI Japanese Tutor</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">드라마틱한 시나리오로 이번에는 일본어를 배우세요! AI 캐릭터와 실제 상황을 연습하며 자연스럽게 일본어 실력을 향상시킬 수 있습니다.</p>
          <Button 
            onClick={() => setCurrentPage('auth')}
            size="lg"
            className="text-lg px-8 py-3"
            data-testid="button-login"
          >
            🚀 무료로 시작하기
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎬 실감나는 시나리오
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                비즈니스 미팅, 카페 주문, 여행 등 실제 상황을 바탕으로 한 드라마틱한 시나리오로 일본어를 연습하세요.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎯 실시간 피드백
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                발음, 문법, 어휘를 실시간으로 분석하여 정확한 한국어 피드백을 제공합니다.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🤖 개성 있는 AI 캐릭터
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                다양한 성격과 배경을 가진 AI 캐릭터들과 자연스러운 대화를 나누며 일본어를 배우세요.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Pricing */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            요금제
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription className="text-2xl font-bold">₩0/월</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✅ 월 30회 대화</li>
                  <li>✅ 이미지 생성 1장</li>
                  <li>✅ 기본 TTS 음성</li>
                  <li>✅ 워터마크 포함</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-500 shadow-lg">
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription className="text-2xl font-bold text-blue-600">₩4,900/월</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✅ 월 300회 대화</li>
                  <li>✅ 이미지 생성 15장</li>
                  <li>✅ 프리미엄 TTS 음성 5종</li>
                  <li>✅ 대화 저장/내보내기</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-purple-500">
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <CardDescription className="text-2xl font-bold text-purple-600">₩9,900/월</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✅ 월 600회 대화</li>
                  <li>✅ 이미지 생성 25장</li>
                  <li>✅ 모든 TTS 음성 10종</li>
                  <li>✅ 시나리오 커스터마이징</li>
                  <li>✅ 발음 교정 AI</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          {/* Premium Plan - Separate Section */}
          <div className="max-w-md mx-auto mt-8">
            <Card className="border-gradient-to-r from-purple-500 to-pink-500 shadow-2xl">
              <CardHeader className="text-center">
                <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full mb-2">
                  최고급
                </div>
                <CardTitle>Premium</CardTitle>
                <CardDescription className="text-3xl font-bold text-purple-600">₩19,900/월</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✅ 월 1,200회 대화</li>
                  <li>✅ 이미지 생성 60장</li>
                  <li>✅ HD 이미지 생성 무제한</li>
                  <li>✅ 실시간 음성 대화</li>
                  <li>✅ 개인 맞춤 학습 분석</li>
                  <li>✅ API 접근 권한</li>
                  <li>✅ 우선 고객지원</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            지금 바로 시작하여 일본어 실력을 한 단계 업그레이드하세요! 🌟
          </p>
        </div>
      </div>
    </div>
  );
}