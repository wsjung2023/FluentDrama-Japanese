import { useAppStore } from '@/store/useAppStore';

export default function LoadingModal() {
  const { isLoading, loadingText } = useAppStore();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating Your Experience</h3>
        <p className="text-gray-600 text-sm">
          {loadingText || 'Please wait...'}
        </p>
      </div>
    </div>
  );
}
