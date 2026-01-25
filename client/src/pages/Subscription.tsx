import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAppStore } from "@/store/useAppStore";
import { Loader2, Check, CreditCard, ArrowLeft } from "lucide-react";

interface BillingPlan {
  id: string;
  name: string;
  priceMonthlyKrw: number;
  stripePriceId: string | null;
  features: {
    conversation_limit_month: number;
    image_limit_month: number;
    tts_limit_month: number;
    model_tier: "basic" | "premium";
  };
  sortOrder: number;
}

interface SubscriptionInfo {
  subscription: {
    id: string;
    planId: string;
    status: string;
    canceledAt: string | null;
    currentPeriodEnd: string | null;
  } | null;
  plan: BillingPlan | null;
}

export default function Subscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setCurrentPage } = useAppStore();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: plansData, isLoading: plansLoading } = useQuery<{ plans: BillingPlan[] }>({
    queryKey: ['/api/billing/plans'],
  });

  const { data: subscriptionData, isLoading: subLoading } = useQuery<SubscriptionInfo>({
    queryKey: ['/api/billing/subscription'],
    enabled: !!user,
  });

  const checkoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await apiRequest("POST", "/api/billing/checkout", { priceId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "로그인 필요",
          description: "다시 로그인해주세요.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "결제 오류",
        description: "결제 페이지를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/billing/portal");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        title: "오류",
        description: "구독 관리 페이지를 불러올 수 없습니다.",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/billing/cancel");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "구독 해지 예약",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/billing/subscription'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: () => {
      toast({
        title: "해지 실패",
        description: "구독 해지 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (plan: BillingPlan) => {
    if (!plan.stripePriceId) {
      toast({
        title: "무료 플랜",
        description: "무료 플랜은 결제가 필요하지 않습니다.",
      });
      return;
    }
    setSelectedPlan(plan.id);
    checkoutMutation.mutate(plan.stripePriceId);
  };

  const handleCancel = () => {
    if (confirm("정말로 구독을 해지하시겠습니까?\n\n해지 후에도 현재 결제 기간이 끝날 때까지 서비스를 이용하실 수 있습니다.")) {
      cancelMutation.mutate();
    }
  };

  const handleManage = () => {
    portalMutation.mutate();
  };

  const currentPlan = subscriptionData?.plan;
  const subscription = subscriptionData?.subscription;
  const isCanceled = subscription?.canceledAt !== null;
  const plans = plansData?.plans || [];

  const formatPrice = (price: number) => {
    if (price === 0) return "무료";
    return `₩${price.toLocaleString()}/월`;
  };

  const getFeatureText = (plan: BillingPlan) => {
    const f = plan.features;
    return [
      `월 ${f.conversation_limit_month}회 대화`,
      `이미지 생성 ${f.image_limit_month}장`,
      `TTS ${f.tts_limit_month}회`,
      f.model_tier === "premium" ? "프리미엄 AI 모델 (GPT-4o)" : "기본 AI 모델 (GPT-4o-mini)",
    ];
  };

  const getPlanBorder = (planId: string) => {
    if (planId === currentPlan?.id) return "border-primary ring-2 ring-primary";
    if (planId === "fluent_pro") return "border-purple-400";
    if (planId === "fluent_premium") return "border-gradient";
    return "";
  };

  if (plansLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              요금제 선택
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              나에게 맞는 플랜을 선택하세요
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setCurrentPage('user-home')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            홈으로
          </Button>
        </div>

        {subscription && currentPlan && (
          <Card className="mb-8 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                현재 구독
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{currentPlan.name}</span>
                    <Badge variant={isCanceled ? "destructive" : "default"}>
                      {isCanceled ? "해지 예정" : "활성"}
                    </Badge>
                  </div>
                  {subscription.currentPeriodEnd && (
                    <p className="text-sm text-gray-500 mt-1">
                      {isCanceled ? "만료일:" : "다음 결제일:"} {new Date(subscription.currentPeriodEnd).toLocaleDateString('ko-KR')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleManage} disabled={portalMutation.isPending}>
                    {portalMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "결제 관리"}
                  </Button>
                  {!isCanceled && currentPlan.priceMonthlyKrw > 0 && (
                    <Button variant="destructive" onClick={handleCancel} disabled={cancelMutation.isPending}>
                      {cancelMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "구독 해지"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const features = getFeatureText(plan);
            const isPremium = plan.id === "fluent_premium";
            const isPro = plan.id === "fluent_pro";

            return (
              <Card 
                key={plan.id}
                className={`relative ${getPlanBorder(plan.id)} ${isPremium ? "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20" : ""}`}
              >
                {isPremium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      최고급
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription className={`text-2xl font-bold mt-2 ${isPro ? "text-purple-600" : isPremium ? "text-pink-600" : "text-primary"}`}>
                    {formatPrice(plan.priceMonthlyKrw)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm mb-6">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <Button variant="secondary" className="w-full" disabled>
                      현재 플랜
                    </Button>
                  ) : plan.priceMonthlyKrw === 0 ? (
                    <Button variant="outline" className="w-full" disabled>
                      무료 플랜
                    </Button>
                  ) : (
                    <Button 
                      className={`w-full ${isPremium ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" : isPro ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                      onClick={() => handleSubscribe(plan)}
                      disabled={checkoutMutation.isPending && selectedPlan === plan.id}
                    >
                      {checkoutMutation.isPending && selectedPlan === plan.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        `${plan.name} 시작하기`
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle>결제 안내</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <h3 className="font-semibold mb-2">🔄 자동 갱신</h3>
                <p className="text-gray-600">
                  모든 유료 플랜은 월 단위로 자동 갱신됩니다. 
                  언제든 해지할 수 있으며, 해지 시 현재 결제 기간 종료까지 이용 가능합니다.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">💳 안전한 결제</h3>
                <p className="text-gray-600">
                  Stripe를 통해 안전하게 결제됩니다. 
                  신용카드, 체크카드로 결제할 수 있습니다.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">📧 환불 정책</h3>
                <p className="text-gray-600">
                  결제 후 7일 이내 청약철회 가능합니다.
                  자세한 내용은 <a href="/refund" className="text-primary underline">환불정책</a>을 확인하세요.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
