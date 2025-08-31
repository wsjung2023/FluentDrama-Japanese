# 모바일 앱 배포 대안들

## 1. PWA (Progressive Web App) - 현재 구현됨 ✅
**특징**: 웹앱이지만 네이티브 앱처럼 동작
- 홈 화면에 아이콘으로 설치
- 오프라인 작동 지원  
- 푸시 알림 가능
- 자동 업데이트

**사용법**: 
1. 크롬/엣지에서 사이트 접속
2. "홈 화면에 추가" 버튼 클릭
3. 앱처럼 사용 가능

## 2. APK Direct Download
Replit 외부에서 빌드:
- Android Studio 설치
- Capacitor 프로젝트 열기
- `npx cap run android` 실행

## 3. Expo (React Native)
완전한 네이티브 앱:
- 새 Expo 프로젝트 생성
- 기존 코드 포팅
- EAS Build로 APK 생성

## 4. 클라우드 빌드 서비스
- GitHub Actions
- Bitrise  
- CircleCI
- CodeMagic

## 추천사항
**지금 당장**: PWA 사용 (이미 완성됨)
**장기적**: Expo로 포팅하여 실제 APK 생성