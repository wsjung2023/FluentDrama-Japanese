# SocialBeing (SB) 모듈 시스템

이 프로젝트는 재사용 가능한 모듈 시스템을 포함하고 있습니다. 새로운 앱을 빠르게 개발할 때 사용할 수 있습니다.

## 사용 가능한 모듈

### 1. sb_payment (결제 모듈)
- **기능**: Paddle 결제 시스템, 구독 관리, 사용량 제한
- **타입**: `SBPaymentConfig`, `SBPricingTier`, `SBUsageLimit`
- **구성품**: 가격 플랜, 결제 처리, 사용량 추적

### 2. sb_auth (인증 모듈)  
- **기능**: 이메일/비밀번호 로그인, 구글 로그인, 세션 관리
- **타입**: `SBAuthConfig`, `SBUser`, `SBAuthState`
- **구성품**: 인증 상태 관리, 사용자 관리

### 3. sb_ai (AI 모듈)
- **기능**: TTS, 이미지 생성, AI 대화, 캐릭터 생성  
- **타입**: `SBAIConfig`, `SBCharacter`, `SBTTSRequest`
- **구성품**: OpenAI 통합, 음성 합성, 이미지 생성

## 새 프로젝트에서 사용하기

### 1. 모듈 복사
```bash
cp -r modules/ /path/to/new-project/modules/
```

### 2. 타입스크립트 설정
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@modules/*": ["./modules/*"]
    }
  }
}
```

### 3. 사용 예시
```typescript
// 영어 학습 앱 (현재)
import { SBAuthConfig } from '@modules/sb_auth';
import { SBPaymentConfig } from '@modules/sb_payment';
import { SBAIConfig } from '@modules/sb_ai';

// 일본어 학습 앱
const japaneseAppConfig = {
  appName: 'AI Japanese Tutor',
  // 동일한 모듈 구조 재사용
};

// 소셜 네트워크 앱
const socialAppConfig = {
  appName: 'AI Social Network',
  // AI 이미지 생성만 사용
};
```

## 환경 변수 설정
```env
# sb_auth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret

# sb_ai  
OPENAI_API_KEY=your_openai_api_key
SUPERTONE_API_KEY=your_supertone_api_key

# sb_payment
PADDLE_VENDOR_ID=your_paddle_vendor_id
PADDLE_API_KEY=your_paddle_api_key
```

## 커스터마이징 가이드

### 가격 플랜 수정
```typescript
const customTiers: SBPricingTier[] = [
  {
    id: 'basic',
    name: '기본',
    price: 5900,
    currency: 'KRW',
    features: ['새로운 기능 1', '새로운 기능 2'],
    usageLimit: { /* 커스텀 제한 */ }
  }
];
```

### AI 설정 변경
```typescript
const customAI: SBAIConfig = {
  openaiApiKey: 'your-key',
  ttsModel: 'tts-1-hd',
  imageGenerationModel: 'dall-e-3',
  chatModel: 'gpt-4o',
  appName: 'Your Custom App'
};
```

## 지원하는 앱 타입

1. **학습 앱** (언어, 기술, 교육)
2. **소셜 앱** (네트워킹, 커뮤니티)  
3. **전자상거래** (제품 판매, 마켓플레이스)
4. **엔터테인먼트** (게임, 미디어)
5. **비즈니스 도구** (생산성, 협업)

## 모듈 확장

새로운 모듈 추가 시:
1. `modules/sb_새모듈/` 폴더 생성
2. `types/`, `hooks/`, `utils/` 구조 유지
3. `index.ts`에서 export
4. 이 README 업데이트

## 버전 관리

- **현재 버전**: 1.0.0
- **호환성**: React 18+, TypeScript 5+
- **종속성**: Next.js, Express.js, PostgreSQL

## 라이센스

이 모듈 시스템은 프로젝트와 함께 제공되며, 새로운 앱 개발에 자유롭게 사용할 수 있습니다.