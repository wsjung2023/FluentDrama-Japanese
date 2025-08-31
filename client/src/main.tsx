import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// 에러 완전 차단
const originalError = console.error;
console.error = (...args: any[]) => {
  // PWA 관련 에러만 무시
  const message = args[0]?.toString() || '';
  if (message.includes('apple-mobile-web-app') || 
      message.includes('manifest') || 
      message.includes('beforeinstallprompt') ||
      message.includes('Service Worker')) {
    return;
  }
  originalError(...args);
};

// React 앱 초기화
const rootElement = document.getElementById("root");
if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(<App />);
    // React 로딩 성공 표시
    (window as any).React = React;
  } catch (error) {
    console.error("React 앱 초기화 오류:", error);
    rootElement.innerHTML = '<div style="padding: 20px; text-align: center;">앱을 로딩 중입니다...</div>';
    setTimeout(() => window.location.reload(), 1000);
  }
}
