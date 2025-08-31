# Expo로 안드로이드 APK 빌드하기

## 1. Expo 프로젝트 생성
```bash
npx create-expo-app AIEnglishTutorMobile
cd AIEnglishTutorMobile
```

## 2. 기존 React 코드를 React Native로 포팅
- `react-dom` → `react-native` 컴포넌트 변환
- `div` → `View`, `span/p` → `Text` 등
- CSS → StyleSheet 변환

## 3. EAS CLI로 APK 빌드
```bash
npm install -g @expo/cli
expo login
eas build -p android
```

## 4. APK 다운로드
빌드 완료 후 Expo 대시보드에서 APK 다운로드 가능

## 장점
✅ 실제 네이티브 APK 생성
✅ 구글 플레이 스토어 업로드 가능
✅ 네이티브 기능 접근 (카메라, 마이크 등)
✅ 푸시 알림, 오프라인 스토리지

## 단점
❌ 코드 포팅 작업 필요
❌ React Native 학습 곡선