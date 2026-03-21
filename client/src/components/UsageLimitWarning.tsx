import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppStore } from "@/store/useAppStore";
import { apiRequest } from "@/lib/queryClient";
import { getUsageWarningCopy } from "@/constants/uiCopy";

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
  const { setCurrentPage, uiLanguage } = useAppStore();
  const copy = getUsageWarningCopy(uiLanguage);

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
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>{copy.usageLabel}</span>
              <span>{usageData.currentUsage}/{usageData.limit}{copy.countSuffix}</span>
            </div>
            <Progress value={usagePercentage} className={isNearLimit ? "bg-red-100" : "bg-blue-100"} />
          </div>

          {isAtLimit && (
            <Alert className="border-red-500 bg-red-50">
              <AlertDescription>{copy.limitReached(usageData.daysUntilReset)}</AlertDescription>
            </Alert>
          )}

          {isNearLimit && !isAtLimit && (
            <Alert className="border-yellow-500 bg-yellow-50">
              <AlertDescription>{copy.nearLimit(usageData.limit - usageData.currentUsage)}</AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-gray-600">{copy.resetIn(usageData.daysUntilReset)}</div>

          {(isNearLimit || isAtLimit) && (
            <Button
              onClick={() => setCurrentPage('subscription')}
              className="w-full"
              data-testid="button-upgrade-subscription"
            >
              {copy.upgrade}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
