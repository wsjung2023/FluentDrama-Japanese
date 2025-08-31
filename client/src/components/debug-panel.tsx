import React from "react";
import { useAuth } from "@/hooks/useAuth";

export function DebugPanel() {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Hide debug panel in production and when not explicitly enabled
  if (import.meta.env.MODE !== 'development' || !import.meta.env.VITE_SHOW_DEBUG) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded text-xs max-w-sm">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div>Loading: {isLoading ? 'true' : 'false'}</div>
      <div>Authenticated: {isAuthenticated ? 'true' : 'false'}</div>
      <div>User: {user ? JSON.stringify(user, null, 2) : 'null'}</div>
    </div>
  );
}