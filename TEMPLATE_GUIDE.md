# SB 모듈 기반 앱 개발 템플릿 가이드

## Replit에서 새 프로젝트 시작하기

### 방법 1: Developer Framework 사용
1. Replit에서 "Create Repl" 클릭
2. Templates에서 "SB AI Learning App Framework" 선택
3. 프로젝트명 설정하고 생성

### 방법 2: GitHub Import
1. 이 프로젝트를 GitHub에 백업
2. Replit에서 "Import from GitHub" 선택  
3. 리포지토리 URL 입력하여 import

### 방법 3: Public Remix
1. 이 Repl을 Public으로 설정
2. 새 프로젝트에서 "Remix" 버튼 클릭
3. 자동으로 복사된 프로젝트에서 커스터마이징

## 빠른 커스터마이징 체크리스트

### 1. 앱 이름 및 테마 변경
```typescript
// shared/schema.ts
export const APP_CONFIG = {
  name: "Your New App Name",
  description: "Your app description",
  theme: "japanese" | "english" | "chinese" | "social"
};
```

### 2. 환경 변수 설정
```env
# 복사해서 새 .env 파일에 붙여넣기
DATABASE_URL=your_new_database_url
GOOGLE_CLIENT_ID=your_new_google_client_id
OPENAI_API_KEY=your_openai_api_key
PADDLE_VENDOR_ID=your_paddle_vendor_id
SESSION_SECRET=your_new_random_secret
```

### 3. 가격 플랜 조정
```typescript
// client/src/pages/Subscription.tsx
const pricingTiers = [
  {
    id: 'starter',
    name: '스타터',
    price: 6900, // 새 가격 설정
    features: ['새 기능 1', '새 기능 2']
  }
];
```

### 4. AI 프롬프트 변경
```typescript
// server/routes.ts - /api/generate-dialogue
const systemPrompt = `You are a helpful ${language} tutor...`; // 언어 변경
```

### 5. 브랜딩 변경
```css
/* client/src/index.css */
:root {
  --primary: 220 100% 50%; /* 새 브랜드 컬러 */
  --accent: 45 100% 60%;
}
```

## 앱 타입별 커스터마이징

### 일본어 학습 앱
- 언어 설정: `ja` → `ko` (일본어 → 한국어 설명)
- 캐릭터: 일본 문화 배경의 캐릭터들
- 시나리오: 일본 여행, 비즈니스, 일상 대화

### 중국어 학습 앱  
- 간체/번체 중국어 설정
- 중국 문화 컨텍스트
- HSK 레벨별 난이도 조정

### 소셜 네트워크 앱
- 모듈 사용: `sb_auth` + `sb_ai` (이미지 생성 중심)
- 결제: 프리미엄 필터, 무제한 포스팅
- 기능: AI 아바타, 자동 태그

### 전자상거래 앱
- 모듈 사용: `sb_auth` + `sb_payment`
- AI 기능: 상품 이미지 생성, 설명 자동화
- 결제: 판매 수수료, 구독 서비스

## 배포 준비 체크리스트

### Replit 배포
- [ ] 환경 변수 모두 설정
- [ ] Database 연결 확인  
- [ ] Google OAuth 리다이렉트 URL 업데이트
- [ ] Paddle 결제 도메인 설정
- [ ] 앱 이름/설명 변경

### 외부 서비스 설정
- [ ] Google Cloud Console - OAuth 설정
- [ ] Paddle - 제품/가격 설정
- [ ] OpenAI - API 사용량 모니터링
- [ ] Neon Database - 새 프로젝트 생성

## 성능 최적화

### 1. 불필요한 모듈 제거
사용하지 않는 모듈은 import하지 않기:
```typescript
// AI 기능이 필요 없다면
// import { SBAIConfig } from '@modules/sb_ai'; // 주석 처리
```

### 2. 번들 크기 최적화
```typescript
// 필요한 기능만 import
import { SBPricingTier } from '@modules/sb_payment/types/payment';
// 전체 모듈 대신: import * from '@modules/sb_payment';
```

### 3. API 호출 최적화
```typescript
// API 호출 캐싱
const cache = new Map();
if (cache.has(key)) return cache.get(key);
```

## 트러블슈팅

### 자주 발생하는 문제들

1. **TypeScript 에러**
   ```bash
   # 모듈 타입 재설치
   npm install --save-dev @types/node
   ```

2. **환경 변수 인식 안됨**
   ```bash
   # Replit Secrets에서 설정 확인
   # 대소문자 정확히 맞추기
   ```

3. **Database 연결 실패**
   ```typescript
   // 연결 문자열 형식 확인
   DATABASE_URL=postgresql://user:pass@host:port/db
   ```

4. **OAuth 리다이렉트 오류**
   ```
   Google Cloud Console에서 승인된 리다이렉트 URI 추가:
   https://your-repl-name.your-username.repl.co/api/auth/callback
   ```

## 지원 및 문의

문제가 발생하면:
1. 이 가이드의 트러블슈팅 섹션 확인
2. Replit 커뮤니티에서 검색
3. GitHub Issues에 문제 보고

## 라이센스 및 사용권

이 템플릿은 상업적 사용을 포함하여 자유롭게 사용할 수 있습니다. 단, 외부 서비스 (OpenAI, Paddle 등)의 별도 약관이 적용됩니다.