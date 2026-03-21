import { Suspense, lazy, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/hooks/useAuth";

import { DebugPanel } from "@/components/debug-panel";

import NavigationHeader from "@/components/navigation-header";
import LoadingModal from "@/components/loading-modal";
import ErrorModal from "@/components/error-modal";

const Auth = lazy(() => import("@/pages/Auth"));
const Landing = lazy(() => import("@/pages/Landing"));
const UserHome = lazy(() => import("@/pages/Home"));
const Subscription = lazy(() => import("@/pages/Subscription"));
const Admin = lazy(() => import("@/pages/Admin"));
const Character = lazy(() => import("@/pages/character"));
const Scenario = lazy(() => import("@/pages/scenario"));
const Playground = lazy(() => import("@/pages/playground"));
const AudienceSelection = lazy(() => import("@/pages/AudienceSelection"));
const Refund = lazy(() => import("@/pages/Refund"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { currentPage, setCurrentPage } = useAppStore();

  useEffect(() => {
    const path = window.location.pathname;
    const pageMap: Record<string, typeof currentPage> = {
      '/terms': 'terms',
      '/privacy': 'privacy',
      '/refund': 'refund',
      '/subscription': 'subscription',
      '/pricing': 'subscription',
    };

    if (pageMap[path] && currentPage !== pageMap[path]) {
      setCurrentPage(pageMap[path]);
    }
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }

  if (currentPage === 'refund') {
    return <Refund />;
  }
  if (currentPage === 'terms') {
    return <Terms />;
  }
  if (currentPage === 'privacy') {
    return <Privacy />;
  }

  if (!isAuthenticated) {
    if (currentPage === 'auth') {
      return <Auth />;
    }
    return <Landing />;
  }

  if (currentPage === 'subscription') {
    return <Subscription />;
  }

  if (currentPage === 'user-home') {
    return <UserHome />;
  }

  switch (currentPage) {
    case 'home':
      return <AudienceSelection />;
    case 'admin':
      return <Admin />;
    case 'character':
      return <Character />;
    case 'scenario':
      return <Scenario />;
    case 'playground':
      return <Playground />;
    default:
      return <UserHome />;
  }
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        {isAuthenticated && <NavigationHeader />}
        <main className={isAuthenticated ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" : ""}>
          <Suspense fallback={<PageLoader />}>
            <Router />
          </Suspense>
        </main>
      </div>
      <LoadingModal />
      <ErrorModal />
      <Toaster />
      <DebugPanel />
    </TooltipProvider>
  );
}

function App() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.log('모듈 로딩 오류 처리됨:', event.message);
      event.preventDefault();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.log('Promise 거부 처리됨:', event.reason);
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
