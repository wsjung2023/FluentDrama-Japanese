// Subscription management page for plan selection, checkout, and billing actions.
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
import { getNavigationCopy, getSubscriptionCopy, getTierLabel } from "@/constants/uiCopy";
import { Loader2, Check, ArrowLeft, Sparkles } from "lucide-react";

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
  const { setCurrentPage, uiLanguage } = useAppStore();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const copy = getSubscriptionCopy(uiLanguage);
  const navigationCopy = getNavigationCopy(uiLanguage);

  const { data: plansData, isLoading: plansLoading } = useQuery<{ plans: BillingPlan[] }>({
    queryKey: ['/api/billing/plans'],
  });

  const { data: subscriptionData, isLoading: subLoading } = useQuery<SubscriptionInfo>({
    queryKey: ['/api/billing/subscription'],
    enabled: !!user,
  });

  const checkoutMutation = useMutation<{ url?: string; redirectUrl?: string }, Error, { tier: string; provider: string }>({
    mutationFn: async ({ tier, provider }: { tier: string; provider: string }) => {
      const response = await apiRequest("POST", "/api/subscribe", { tier, provider });
      return response.json();
    },
    onSuccess: (data) => {
      const targetUrl = data.url ?? data.redirectUrl;
      if (targetUrl) {
        window.location.href = targetUrl;
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: copy.loginRequired,
          description: copy.loginRequiredDescription,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: copy.paymentError,
        description: copy.paymentErrorDescription,
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
      const targetUrl = data.url ?? data.redirectUrl;
      if (targetUrl) {
        window.location.href = targetUrl;
      }
    },
    onError: () => {
      toast({
        title: copy.genericError,
        description: copy.billingPageErrorDescription,
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
        title: copy.cancelScheduled,
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/billing/subscription'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: () => {
      toast({
        title: copy.cancelFailed,
        description: copy.cancelFailedDescription,
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (plan: BillingPlan) => {
    if (!plan.stripePriceId) {
      toast({
        title: copy.freePlan,
        description: copy.freePlanDescription,
      });
      return;
    }
    setSelectedPlan(plan.id);
    checkoutMutation.mutate({ tier: plan.id, provider: "stripe" });
  };

  const handleCancel = () => {
    if (confirm(copy.cancelConfirm)) {
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


  const getLocalizedPlanName = (planId: string, fallbackName: string) => {
    const localized = getTierLabel(uiLanguage, planId);
    return localized === planId ? fallbackName : localized;
  };

  const formatPrice = (price: number) => {
    if (price === 0) return copy.freePrice;
    return `₩${price.toLocaleString()}`;
  };

  const getFeatureText = (plan: BillingPlan) => {
    const f = plan.features;
    return [
      copy.conversationPerMonth(f.conversation_limit_month),
      copy.imagesPerMonth(f.image_limit_month),
      copy.ttsPerMonth(f.tts_limit_month),
      f.model_tier === "premium" ? "GPT-4o" : "GPT-4o-mini",
    ];
  };

  const getPlanStyle = (planId: string) => {
    if (planId === currentPlan?.id) return "border-primary ring-2 ring-primary shadow-lg";
    if (planId === "fluent_premium") return "border-purple-400 shadow-md";
    if (planId === "fluent_pro") return "border-purple-300";
    return "border-gray-200";
  };

  if (plansLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pb-safe">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {copy.title}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
              {copy.subtitle}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="self-start sm:self-auto"
            onClick={() => setCurrentPage('user-home')}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {copy.backHome}
          </Button>
        </div>

        {/* Current Subscription */}
        {!!user && currentPlan && subscription && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{copy.currentSubscription}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl font-bold">{getLocalizedPlanName(currentPlan.id, currentPlan.name)}</span>
                    <Badge variant={isCanceled ? "destructive" : "default"} className="text-xs">
                      {isCanceled ? copy.canceling : copy.active}
                    </Badge>
                  </div>
                </div>
                {subscription.currentPeriodEnd && (
                  <p className="text-xs sm:text-sm text-gray-500">
                    {isCanceled ? copy.expiresOn : copy.nextBilling} {new Date(subscription.currentPeriodEnd).toLocaleDateString(uiLanguage === 'ko' ? 'ko-KR' : uiLanguage === 'ja' ? 'ja-JP' : 'en-US')}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleManage} 
                    disabled={portalMutation.isPending}
                    className="flex-1 sm:flex-none min-w-[100px]"
                  >
                    {portalMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : copy.manageBilling}
                  </Button>
                  {!isCanceled && currentPlan.priceMonthlyKrw > 0 && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleCancel} 
                      disabled={cancelMutation.isPending}
                      className="flex-1 sm:flex-none min-w-[100px]"
                    >
                      {cancelMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : copy.cancelSubscription}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const features = getFeatureText(plan);
            const isPremium = plan.id === "fluent_premium";
            const isPro = plan.id === "fluent_pro";

            return (
              <Card 
                key={plan.id}
                className={`relative ${getPlanStyle(plan.id)} ${isPremium ? "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20" : "bg-white/90"}`}
              >
                {isPremium && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-0.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {copy.premiumBadge}
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-base sm:text-lg">{getLocalizedPlanName(plan.id, plan.name)}</CardTitle>
                  <div className="flex items-baseline gap-1 mt-1">
                    <CardDescription className={`text-xl sm:text-2xl font-bold ${isPro ? "text-purple-600" : isPremium ? "text-pink-600" : "text-primary"}`}>
                      {formatPrice(plan.priceMonthlyKrw)}
                    </CardDescription>
                    {plan.priceMonthlyKrw > 0 && (
                      <span className="text-xs text-gray-500">{copy.perMonth}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <ul className="space-y-1.5 text-xs sm:text-sm mb-4">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <Button variant="secondary" size="sm" className="w-full h-9" disabled>
                      {copy.currentPlan}
                    </Button>
                  ) : plan.priceMonthlyKrw === 0 ? (
                    <Button variant="outline" size="sm" className="w-full h-9" disabled>
                      {copy.freePlan}
                    </Button>
                  ) : (
                    <Button 
                      size="sm"
                      className={`w-full h-9 ${isPremium ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" : isPro ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                      onClick={() => handleSubscribe(plan)}
                      disabled={checkoutMutation.isPending && selectedPlan === plan.id}
                    >
                      {checkoutMutation.isPending && selectedPlan === plan.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        copy.startPlan(getLocalizedPlanName(plan.id, plan.name))
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-6 bg-white/90 backdrop-blur">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-base sm:text-lg">{copy.paymentInfo}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div className="flex gap-3">
                <span className="text-xl">🔄</span>
                <div>
                  <h3 className="font-semibold mb-1">{copy.autoRenew}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {copy.autoRenewDescription}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-xl">💳</span>
                <div>
                  <h3 className="font-semibold mb-1">{copy.securePayment}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {copy.securePaymentDescription}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-xl">📧</span>
                <div>
                  <h3 className="font-semibold mb-1">{copy.refundPolicy}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {copy.refundPolicyDescription}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-gray-500">
          <button onClick={() => setCurrentPage('terms')} className="hover:underline">{copy.terms}</button>
          <button onClick={() => setCurrentPage('privacy')} className="hover:underline">{copy.privacy}</button>
          <button onClick={() => setCurrentPage('refund')} className="hover:underline">{copy.refund}</button>
        </div>
      </div>
    </div>
  );
}
