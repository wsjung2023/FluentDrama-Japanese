import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppStore } from "@/store/useAppStore";
import { apiRequest } from "@/lib/queryClient";

interface UsageData {
  canUse: boolean;
  currentUsage: number;
  limit: number;
  tier: string;
  daysUntilReset: number;
}

export function UsageLimitWarning() {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setCurrentPage } = useAppStore();

  useEffect(() => {
    checkUsage();
  }, []);

  const checkUsage = async () => {
    try {
      const response = await apiRequest("POST", "/api/check-usage");
      const data = await response.json();
      setUsageData(data);
    } catch (error) {
      console.error("Failed to check usage:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !usageData) {
    return null;
  }

  const usagePercentage = (usageData.currentUsage / usageData.limit) * 100;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = !usageData.canUse;

  if (usageData.tier !== 'free' || usagePercentage < 50) {
    return null; // 무료 플랜이 아니거나 사용량이 50% 미만이면 표시하지 않음
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 이용량 현황
        </CardTitle>
        <CardDescription>
          무료 플랜 월간 대화 이용량
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>사용량</span>
              <span>{usageData.currentUsage}/{usageData.limit}회</span>
            </div>
            <Progress 
              value={usagePercentage} 
              className={isNearLimit ? "bg-red-100" : "bg-blue-100"}
            />
          </div>

          {isAtLimit && (
            <Alert className="border-red-500 bg-red-50">
              <AlertDescription>
                ⛔ 이번 달 무료 대화 횟수를 모두 사용했습니다. 
                {usageData.daysUntilReset}일 후 초기화되거나 유료 플랜으로 업그레이드하세요.
              </AlertDescription>
            </Alert>
          )}

          {isNearLimit && !isAtLimit && (
            <Alert className="border-yellow-500 bg-yellow-50">
              <AlertDescription>
                ⚠️ 무료 대화 횟수가 거의 소진되었습니다. 
                {usageData.limit - usageData.currentUsage}회 남았습니다.
              </AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-gray-600">
            다음 초기화: {usageData.daysUntilReset}일 후
          </div>

          {(isNearLimit || isAtLimit) && (
            <Button 
              onClick={() => setCurrentPage('subscription')}
              className="w-full"
              data-testid="button-upgrade-subscription"
            >
              유료 플랜으로 업그레이드
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}