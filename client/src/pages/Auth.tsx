import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { getAuthCopy, getNavigationCopy } from "@/constants/uiCopy";
import { ArrowLeft, ExternalLink, Copy } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [showBrowserWarning, setShowBrowserWarning] = useState(false);
  const { toast } = useToast();
  const { setCurrentPage, uiLanguage } = useAppStore();
  const copy = getAuthCopy(uiLanguage);
  const navigationCopy = getNavigationCopy(uiLanguage);

  // 인앱 브라우저 감지
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isInApp = 
      /KAKAOTALK/i.test(userAgent) ||
      /Line/i.test(userAgent) ||
      /Instagram/i.test(userAgent) ||
      /FBAN|FBAV/i.test(userAgent) ||
      /wv/.test(userAgent) ||
      /WebView/i.test(userAgent);
    
    setIsInAppBrowser(isInApp);
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/login', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: copy.loginFailed,
        description: error.message || copy.loginFailedDescription,
        variant: "destructive"
      });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; firstName: string; lastName: string }) => {
      const response = await apiRequest('POST', '/api/register', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: copy.signupFailed,
        description: error.message || copy.signupFailedDescription,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      loginMutation.mutate({
        email: formData.email,
        password: formData.password
      });
    } else {
      if (!formData.firstName || !formData.lastName) {
        toast({
          title: copy.inputError,
          description: copy.inputErrorDescription,
          variant: "destructive"
        });
        return;
      }
      registerMutation.mutate(formData);
    }
  };

  const handleGoogleLogin = () => {
    if (isInAppBrowser) {
      setShowBrowserWarning(true);
      return;
    }
    window.location.href = '/api/google';
  };

  const copyCurrentUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: copy.copied,
        description: copy.copiedDescription,
      });
    } catch (err) {
      // 클립보드 접근이 안되면 fallback
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast({
        title: copy.copied,
        description: copy.copiedDescription,
      });
    }
  };

  const openInExternalBrowser = () => {
    // 안드로이드: intent 사용하여 외부 브라우저로 열기
    if (/Android/i.test(navigator.userAgent)) {
      window.location.href = `intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;end`;
    } else {
      // iOS: 기본 브라우저로 열기 (사파리)
      window.open(window.location.href, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setCurrentPage('landing')}
          className="mb-4 p-2"
          data-testid="button-back-to-landing"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {copy.back}
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{navigationCopy.logoTitle}</h1>
          <p className="text-gray-600 dark:text-gray-300">{copy.subtitle}</p>
        </div>

        {/* 카카오톡 브라우저 안내문 */}
        {isInAppBrowser && (
          <Card className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <CardContent className="p-4">
              <div className="text-center text-amber-800 dark:text-amber-200">
                <ExternalLink className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-medium mb-1">{copy.inAppTitle}</p>
                <p className="text-xs">
                  {copy.inAppDescription}
                  <br />
                  {copy.inAppDescriptionLine2}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{isLogin ? copy.login : copy.signup}</CardTitle>
            <CardDescription>
              {isLogin ? copy.loginDescription : copy.signupDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">{copy.firstName}</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      required={!isLogin}
                      data-testid="input-firstName"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">{copy.lastName}</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      required={!isLogin}
                      data-testid="input-lastName"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="email">{copy.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  data-testid="input-email"
                />
              </div>
              
              <div>
                <Label htmlFor="password">{copy.password}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  data-testid="input-password"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={loginMutation.isPending || registerMutation.isPending}
                data-testid="button-submit"
              >
                {isLogin ? copy.login : copy.signup}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">{copy.or}</span>
              </div>
            </div>

            {showBrowserWarning ? (
              <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                <CardContent className="p-4">
                  <div className="text-center space-y-4">
                    <div className="text-orange-800 dark:text-orange-200">
                      <ExternalLink className="w-8 h-8 mx-auto mb-2" />
                      <h3 className="font-semibold mb-2">{copy.externalBrowserRequired}</h3>
                      <p className="text-sm">
                        {copy.externalBrowserDescription}
                        <br />
                        {copy.externalBrowserDescriptionLine2}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={openInExternalBrowser}
                        data-testid="button-open-external"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {copy.openExternalBrowser}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={copyCurrentUrl}
                        data-testid="button-copy-url"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        {copy.copyLink}
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full text-sm"
                        onClick={() => setShowBrowserWarning(false)}
                        data-testid="button-cancel-warning"
                      >
                        {copy.cancel}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleGoogleLogin}
                data-testid="button-google"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {copy.continueWithGoogle}
              </Button>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-blue-600 hover:underline"
              data-testid="button-switch-mode"
            >
                {isLogin ? copy.toggleSignup : copy.toggleAuth}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
