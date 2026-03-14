import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAppStore } from "@/store/useAppStore";

export default function Subscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setCurrentPage } = useAppStore();
  const [selectedProvider, setSelectedProvider] = useState<'paddle'>('paddle');

  const subscribeMutation = useMutation<{ redirectUrl?: string }, Error, { tier: string; provider: string }>({
    mutationFn: async ({ tier, provider }: { tier: string; provider: string }) => {
      const response = await apiRequest("POST", "/api/subscribe", { tier, provider });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toast({
          title: "구독 완료",
          description: "성공적으로 구독되었습니다!",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "로그인 필요",
          description: "다시 로그인해주세요.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "구독 실패",
        description: "구독 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/cancel-subscription");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "구독 취소",
        description: "구독이 취소되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "로그인 필요",
          description: "다시 로그인해주세요.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "취소 실패",
        description: "구독 취소 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (tier: string) => {
    subscribeMutation.mutate({ tier, provider: selectedProvider });
  };

  const handleCancel = () => {
    if (confirm("정말로 구독을 취소하시겠습니까?")) {
      cancelMutation.mutate();
    }
  };

  const getCurrentBadge = () => {
    const tier = (user as any)?.subscriptionTier || 'free';
    switch (tier) {
      case 'premium':
        return <Badge className="bg-blue-500">현재 이용 중</Badge>;
      case 'pro':
        return <Badge className="bg-purple-500">현재 이용 중</Badge>;
      default:
        return <Badge variant="secondary">현재 이용 중</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              구독 관리
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              요금제를 선택하거나 구독을 관리하세요
            </p>
          </div>
          <Button 
            variant="outline" 
            data-testid="button-back-home"
            onClick={() => setCurrentPage('user-home')}
          >
            홈으로
          </Button>
        </div>

        {/* Current Subscription */}
        {!!user && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>현재 구독 상태</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-semibold">
                    {(user as any)?.subscriptionTier === 'free' ? '무료 플랜' : 
                     (user as any)?.subscriptionTier === 'premium' ? '프리미엄 플랜' : '프로 플랜'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    상태: {(user as any)?.subscriptionStatus === 'active' ? '활성' : '비활성'}
                  </p>
                </div>
                {getCurrentBadge()}
                {((user as any)?.subscriptionTier || 'free') !== 'free' && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleCancel}
                    disabled={cancelMutation.isPending}
                    data-testid="button-cancel-subscription"
                  >
                    {cancelMutation.isPending ? "취소 중..." : "구독 취소"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Method Selection - Only Paddle Available */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>결제 방법</CardTitle>
            <CardDescription>
              안전하고 신뢰할 수 있는 글로벌 결제 시스템을 사용합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Button
                variant="default"
                disabled
                className="bg-blue-600 text-white"
                data-testid="button-provider-paddle"
              >
                <i className="fas fa-credit-card mr-2"></i>
                Paddle 결제 시스템
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className={`${((user as any)?.subscriptionTier || 'free') === 'free' ? 'border-blue-500 shadow-lg' : ''}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>무료 플랜</CardTitle>
                  <CardDescription className="text-2xl font-bold mt-2">₩0/월</CardDescription>
                </div>
                {((user as any)?.subscriptionTier || 'free') === 'free' && getCurrentBadge()}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm mb-6">
                <li>✅ 월 30회 대화</li>
                <li>✅ 이미지 생성 1장</li>
                <li>✅ 기본 TTS 음성</li>
                <li>✅ 워터마크 포함</li>
              </ul>
              {((user as any)?.subscriptionTier || 'free') !== 'free' && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                  data-testid="button-downgrade-free"
                >
                  무료 플랜으로 변경
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className={`${((user as any)?.subscriptionTier || 'free') === 'starter' ? 'border-blue-500 shadow-lg' : 'border-blue-300'}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>스타터 플랜</CardTitle>
                  <CardDescription className="text-2xl font-bold text-blue-600 mt-2">₩4,900/월</CardDescription>
                </div>
                {((user as any)?.subscriptionTier || 'free') === 'starter' && getCurrentBadge()}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm mb-6">
                <li>✅ 월 300회 대화</li>
                <li>✅ 이미지 생성 15장</li>
                <li>✅ 프리미엄 TTS 음성 5종</li>
                <li>✅ 대화 저장/내보내기</li>
              </ul>
              {((user as any)?.subscriptionTier || 'free') !== 'starter' && (
                <Button 
                  className="w-full"
                  onClick={() => handleSubscribe('starter')}
                  disabled={subscribeMutation.isPending}
                  data-testid="button-subscribe-starter"
                >
                  {subscribeMutation.isPending ? "처리 중..." : "스타터 시작"}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className={`${((user as any)?.subscriptionTier || 'free') === 'pro' ? 'border-purple-500 shadow-lg' : 'border-purple-300'}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>프로 플랜</CardTitle>
                  <CardDescription className="text-2xl font-bold text-purple-600 mt-2">₩9,900/월</CardDescription>
                </div>
                {((user as any)?.subscriptionTier || 'free') === 'pro' && getCurrentBadge()}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm mb-6">
                <li>✅ 월 600회 대화</li>
                <li>✅ 이미지 생성 25장</li>
                <li>✅ 모든 TTS 음성 10종</li>
                <li>✅ 시나리오 커스터마이징</li>
                <li>✅ 발음 교정 AI</li>
              </ul>
              {((user as any)?.subscriptionTier || 'free') !== 'pro' && (
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => handleSubscribe('pro')}
                  disabled={subscribeMutation.isPending}
                  data-testid="button-subscribe-pro"
                >
                  {subscribeMutation.isPending ? "처리 중..." : "프로 시작"}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className={`${((user as any)?.subscriptionTier || 'free') === 'premium' ? 'border-gradient-to-r from-purple-500 to-pink-500 shadow-2xl' : 'border-purple-300'}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full mb-2">
                    최고급
                  </div>
                  <CardTitle>프리미엄 플랜</CardTitle>
                  <CardDescription className="text-3xl font-bold text-purple-600 mt-2">₩19,900/월</CardDescription>
                </div>
                {((user as any)?.subscriptionTier || 'free') === 'premium' && getCurrentBadge()}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm mb-6">
                <li>✅ 월 1,200회 대화</li>
                <li>✅ 이미지 생성 60장</li>
                <li>✅ HD 이미지 생성 무제한</li>
                <li>✅ 실시간 음성 대화</li>
                <li>✅ 24/7 우선 지원</li>
                <li>✅ API 접근 권한</li>
                <li>✅ 우선 고객지원</li>
              </ul>
              {((user as any)?.subscriptionTier || 'free') !== 'premium' && (
                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  onClick={() => handleSubscribe('premium')}
                  disabled={subscribeMutation.isPending}
                  data-testid="button-subscribe-premium"
                >
                  {subscribeMutation.isPending ? "처리 중..." : "프리미엄 시작"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Usage Limits Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>이용 안내</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">🔄 결제 주기</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  모든 유료 플랜은 월 단위로 자동 갱신됩니다. 언제든 취소할 수 있으며, 
                  취소 시 현재 결제 주기 종료까지 서비스를 이용할 수 있습니다.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">💳 지원 결제 방법</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  신용카드, 체크카드, 계좌이체, 휴대폰 결제 등 다양한 방법으로 
                  안전하게 결제할 수 있습니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}