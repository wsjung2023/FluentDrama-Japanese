# AI English Tutor - Interactive Language Learning Platform

맞춤형 AI 캐릭터와 대화하며 영어를 배우는 몰입형 학습 플랫폼입니다.

## 🚀 Features

### Core Functionality
- **3단계 대상 선택**: 중·고생, 대학생·일반인, 비즈니스 직장인
- **AI 캐릭터 생성**: DALL-E로 맞춤형 튜터 이미지 생성
- **시나리오 기반 학습**: 대상별 맞춤 프리셋 또는 자유 입력
- **AI 대화 생성**: GPT-4o로 3줄 대화와 핵심 표현 추천
- **TTS 음성 합성**: Supertone으로 자연스러운 음성 재생
- **실시간 자막**: 재생 중인 문장 하이라이트

### User Experience
- **영상 같은 연출**: CSS 애니메이션으로 몰입감 제공
- **대상별 테마**: 파스텔(학생), 코지(일반), 딥블루(비즈니스)
- **모바일 반응형**: 모든 디바이스에서 완벽한 사용 경험
- **진행도 추적**: 학습 진행상황 시각화

## 🛠 Tech Stack

### Frontend
- **React 18** + **Vite** - 빠른 개발과 빌드
- **TypeScript** - 타입 안전성
- **Zustand** - 가벼운 상태 관리
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **Wouter** - 경량 라우팅
- **Shadcn/ui** - 모던 UI 컴포넌트

### Backend
- **Express.js** - Node.js 웹 프레임워크
- **TypeScript** - 백엔드 타입 안전성
- **Zod** - 런타임 타입 검증

### AI Services
- **OpenAI GPT-4o** - 대화 생성 (최신 모델)
- **OpenAI DALL-E 3** - 캐릭터 이미지 생성
- **Supertone** - 고품질 TTS 음성 합성

## 📋 Prerequisites

- **Node.js** 18+ 
- **npm** 또는 **yarn**
- **OpenAI API Key** (GPT-4o, DALL-E 3)
- **Supertone API Key** (TTS)

## 🚀 Quick Start

### 1. Repository Clone
```bash
git clone <repository-url>
cd ai-english-tutor
