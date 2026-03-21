import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLandingCopy, getNavigationCopy } from "@/constants/uiCopy";
import { useAppStore } from "@/store/useAppStore";

export default function Landing() {
  const { setCurrentPage, uiLanguage } = useAppStore();
  const landingCopy = getLandingCopy(uiLanguage);
  const navigationCopy = getNavigationCopy(uiLanguage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">{navigationCopy.logoTitle}</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">{landingCopy.heroDescription}</p>
          <Button 
            onClick={() => setCurrentPage('auth')}
            size="lg"
            className="text-lg px-8 py-3"
            data-testid="button-login"
          >
            {landingCopy.startFree}
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {landingCopy.featuresTitle[0]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {landingCopy.featuresDescription[0]}
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {landingCopy.featuresTitle[1]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {landingCopy.featuresDescription[1]}
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {landingCopy.featuresTitle[2]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {landingCopy.featuresDescription[2]}
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Pricing */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            {landingCopy.pricingTitle}
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>{navigationCopy.tierFree}</CardTitle>
                <CardDescription className="text-2xl font-bold">₩0{landingCopy.perMonth}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {landingCopy.planFeatures.free.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-500 shadow-lg">
              <CardHeader>
                <CardTitle>{navigationCopy.tierStarter}</CardTitle>
                <CardDescription className="text-2xl font-bold text-blue-600">₩4,900{landingCopy.perMonth}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {landingCopy.planFeatures.starter.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-purple-500">
              <CardHeader>
                <CardTitle>{navigationCopy.tierPro}</CardTitle>
                <CardDescription className="text-2xl font-bold text-purple-600">₩9,900{landingCopy.perMonth}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {landingCopy.planFeatures.pro.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
              </CardContent>
            </Card>
          </div>
          
          {/* Premium Plan - Separate Section */}
          <div className="max-w-md mx-auto mt-8">
            <Card className="border-gradient-to-r from-purple-500 to-pink-500 shadow-2xl">
              <CardHeader className="text-center">
                <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full mb-2">
                  {landingCopy.premiumBadge}
                </div>
                <CardTitle>{navigationCopy.tierPremium}</CardTitle>
                <CardDescription className="text-3xl font-bold text-purple-600">₩19,900{landingCopy.perMonth}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {landingCopy.planFeatures.premium.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {landingCopy.footer}
          </p>
        </div>
      </div>
    </div>
  );
}
