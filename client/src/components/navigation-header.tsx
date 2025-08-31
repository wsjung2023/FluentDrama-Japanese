import { useAppStore, type AppState } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function NavigationHeader() {
  const { currentPage, setCurrentPage, resetState, audience, character } = useAppStore();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleLogoClick = () => {
    resetState();
    setCurrentPage('home');
    setIsMobileMenuOpen(false);
  };

  const isActive = (page: string) => currentPage === page;

  const handleMenuClick = (page: AppState['currentPage']) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button onClick={handleLogoClick} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-graduation-cap text-white text-sm"></i>
            </div>
            <h1 className="text-xl font-poppins font-semibold text-gray-900">🎭 AI Japanese Tutor</h1>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <button 
              onClick={() => handleMenuClick('user-home')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('user-home') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              data-testid="nav-user-home"
            >
              <i className="fas fa-home mr-1"></i> 홈
            </button>
            
            <button 
              onClick={() => {
                resetState(); // 학습 상태 초기화
                handleMenuClick('home');
              }}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('home') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              data-testid="nav-audience"
            >
              <i className="fas fa-users mr-1"></i> 학습
            </button>
            
            <button 
              onClick={() => handleMenuClick('character')}
              disabled={!audience}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('character') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed'
              }`}
              data-testid="nav-character"
            >
              <i className="fas fa-user mr-1"></i> 캐릭터
            </button>

            <button 
              onClick={() => handleMenuClick('subscription')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                isActive('subscription') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              data-testid="nav-subscription"
            >
              <i className="fas fa-crown mr-1"></i> 구독
              {(user as any)?.subscriptionTier === 'starter' && <Badge className="bg-green-500 text-xs">스타터</Badge>}
              {(user as any)?.subscriptionTier === 'pro' && <Badge className="bg-purple-500 text-xs">프로</Badge>}
              {(user as any)?.subscriptionTier === 'premium' && <Badge className="bg-blue-500 text-xs">프리미엄</Badge>}
            </button>



            {(user as any)?.isAdmin && (
              <button 
                onClick={() => setCurrentPage('admin')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('admin') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                data-testid="nav-admin"
              >
                <i className="fas fa-cog mr-1"></i> 관리자
              </button>
            )}

            <Button 
              onClick={() => setCurrentPage('playground')}
              disabled={!character.name}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              data-testid="nav-start-learning"
            >
              <i className="fas fa-play mr-1"></i> 학습 시작
            </Button>

            <Button 
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await fetch('/api/logout', { method: 'POST' });
                  window.location.reload();
                } catch (error) {
                  console.error('Logout error:', error);
                  // Fallback to GET request
                  window.location.href = '/api/logout';
                }
              }}
              data-testid="nav-logout"
            >
              로그아웃
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="mobile-menu-button"
          >
            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              <button 
                onClick={() => handleMenuClick('user-home')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('user-home') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                data-testid="mobile-nav-user-home"
              >
                <i className="fas fa-home mr-2"></i> 홈
              </button>
              
              <button 
                onClick={() => {
                  resetState(); // 학습 상태 초기화
                  handleMenuClick('home');
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('home') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                data-testid="mobile-nav-audience"
              >
                <i className="fas fa-users mr-2"></i> 학습
              </button>
              
              <button 
                onClick={() => handleMenuClick('character')}
                disabled={!audience}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('character') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed'
                }`}
                data-testid="mobile-nav-character"
              >
                <i className="fas fa-user mr-2"></i> 캐릭터
              </button>

              <button 
                onClick={() => handleMenuClick('subscription')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  isActive('subscription') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                data-testid="mobile-nav-subscription"
              >
                <i className="fas fa-crown mr-2"></i> 구독
                {(user as any)?.subscriptionTier === 'starter' && <Badge className="bg-green-500 text-xs">스타터</Badge>}
                {(user as any)?.subscriptionTier === 'pro' && <Badge className="bg-purple-500 text-xs">프로</Badge>}
                {(user as any)?.subscriptionTier === 'premium' && <Badge className="bg-blue-500 text-xs">프리미엄</Badge>}
              </button>



              {(user as any)?.isAdmin && (
                <button 
                  onClick={() => handleMenuClick('admin')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('admin') 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  data-testid="mobile-nav-admin"
                >
                  <i className="fas fa-cog mr-2"></i> 관리자
                </button>
              )}

              <Button 
                onClick={() => handleMenuClick('playground')}
                disabled={!character.name}
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mt-2"
                data-testid="mobile-nav-start-learning"
              >
                <i className="fas fa-play mr-2"></i> 학습 시작
              </Button>

              <Button 
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={async () => {
                  try {
                    await fetch('/api/logout', { method: 'POST' });
                    window.location.reload();
                  } catch (error) {
                    console.error('Logout error:', error);
                    window.location.href = '/api/logout';
                  }
                }}
                data-testid="mobile-nav-logout"
              >
                로그아웃
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
