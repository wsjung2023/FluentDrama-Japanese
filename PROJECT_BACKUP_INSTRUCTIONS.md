# 프로젝트 백업 및 재사용 가이드

## 1. GitHub 백업 (필수)

### Git 초기 설정
```bash
git init
git add .
git commit -m "Initial commit: SB AI Learning Platform with Modular System"
```

### GitHub Repository 생성 후
```bash
git branch -M main
git remote add origin https://github.com/yourusername/sb-ai-learning-platform.git
git push -u origin main
```

### 지속적 백업
```bash
# 중요한 변경 후마다 실행
git add .
git commit -m "Feature: 새로운 기능 설명"
git push origin main
```

## 2. Replit Developer Framework 발행

### 준비 사항
- [ ] README.md 파일이 잘 작성되어 있는지 확인
- [ ] .env.example 파일로 환경 변수 예시 제공
- [ ] 주석이 잘 달린 코드 확인
- [ ] 기본 설정으로 앱이 실행되는지 테스트

### 발행 절차
1. Replit에서 "Publish this Repl" 클릭
2. "Apps" 탭에서 앱 정보 입력:
   - **Title**: "SB AI Learning Platform Framework"
   - **Description**: "Complete framework for AI-powered learning apps with authentication, payments, and modular AI features"
   - **Tags**: "framework", "ai", "learning", "authentication", "payments"
3. 마지막 단계에서 "Publish as Developer Framework" 체크
4. "Publish" 클릭

### Framework 설명 작성
```
🚀 SB AI Learning Platform Framework

완전한 AI 학습 앱 개발 프레임워크입니다. 새로운 언어 학습 앱을 몇 분만에 시작할 수 있습니다.

✨ 포함된 기능:
• 🔐 완전한 인증 시스템 (Google OAuth + 이메일/비밀번호)
• 💳 Paddle 결제 시스템 (KRW 지원)
• 🤖 OpenAI 통합 (GPT-4, DALL-E 3, TTS)
• 📱 반응형 UI (Shadcn/ui + Tailwind)
• 🗄️ PostgreSQL 데이터베이스
• 🎯 사용량 제한 및 구독 관리

🎯 사용 사례:
• 언어 학습 앱 (영어, 일본어, 중국어 등)
• AI 튜터링 플랫폼
• 소셜 학습 네트워크
• 맞춤형 교육 도구

🔧 시작하기:
1. 환경 변수 설정 (.env.example 참조)
2. Google OAuth 및 Paddle 계정 설정
3. OpenAI API 키 추가
4. 앱 이름과 브랜딩 커스터마이징

📚 완전한 문서와 예시 코드가 포함되어 있습니다.
```

## 3. Public Repl로 만들어서 Remix 가능하게 하기

### Public 설정
1. Repl 설정에서 "Make this Repl public" 활성화
2. Privacy 설정을 "Public"으로 변경
3. Gallery에 제출 (선택사항)

### Remix를 위한 준비
```markdown
# README.md에 추가할 내용

## 🔄 이 프로젝트를 Remix해서 사용하기

1. **Remix 버튼** 클릭하여 복사본 생성
2. **환경 변수 설정**:
   - GOOGLE_CLIENT_ID: Google Cloud Console에서 생성
   - OPENAI_API_KEY: OpenAI 대시보드에서 생성
   - DATABASE_URL: Neon Database에서 생성
   - SESSION_SECRET: 랜덤 문자열 생성
3. **외부 서비스 설정**:
   - Google OAuth 리다이렉트 URL 추가
   - Paddle 결제 도메인 설정
4. **앱 커스터마이징**:
   - shared/schema.ts에서 앱 이름 변경
   - client/src/pages/Landing.tsx에서 랜딩 페이지 수정
   - 가격 플랜 조정

🚀 이제 나만의 AI 학습 앱이 준비되었습니다!
```

## 4. 모듈 시스템 별도 관리

### 모듈만 별도 리포지토리로 분리
```bash
# 새 리포지토리 생성
mkdir sb-modules
cd sb-modules
git init

# 모듈 폴더만 복사
cp -r ../original-project/modules .
cp ../original-project/SB_MODULES_README.md README.md

# Git에 커밋
git add .
git commit -m "SB Modules: Reusable components for rapid app development"
git remote add origin https://github.com/yourusername/sb-modules.git
git push -u origin main
```

### Git Submodule로 사용하기
```bash
# 새 프로젝트에서
git submodule add https://github.com/yourusername/sb-modules.git modules
```

## 5. 재사용 전략

### A. 언어별 변형 앱
```bash
# 일본어 학습 앱
git clone https://github.com/yourusername/sb-ai-learning-platform.git japanese-tutor
cd japanese-tutor
# 일본어 관련 커스터마이징
```

### B. 기능별 앱
```bash
# AI 소셜 네트워크 (이미지 생성 중심)
git clone https://github.com/yourusername/sb-ai-learning-platform.git ai-social
cd ai-social
# 소셜 기능 추가, 학습 기능 제거
```

### C. 비즈니스 모델별 앱
```bash
# B2B 교육 솔루션
git clone https://github.com/yourusername/sb-ai-learning-platform.git b2b-education
cd b2b-education
# 기업용 기능 추가, 가격 플랜 변경
```

## 6. 버전 관리 전략

### Semantic Versioning
- **Major (1.0.0)**: 큰 구조 변경
- **Minor (1.1.0)**: 새 기능 추가  
- **Patch (1.1.1)**: 버그 수정

### 브랜치 전략
```bash
git checkout -b feature/new-language-support
git checkout -b fix/payment-issue
git checkout -b release/v1.1.0
```

### Tag 관리
```bash
git tag -a v1.0.0 -m "Initial stable release"
git push origin v1.0.0
```

## 7. 지속적인 업데이트

### 모듈 업데이트 프로세스
1. 원본 프로젝트에서 모듈 개선
2. sb-modules 리포지토리에 업데이트 푸시
3. 기존 프로젝트들에서 `git submodule update --remote`

### 보안 업데이트
- 정기적인 dependency 업데이트
- API 키 로테이션
- 보안 패치 적용

이 가이드를 따라하면 효율적으로 프로젝트를 백업하고 재사용할 수 있습니다!