# Ticket 09 — 디자인 토큰 정비

  ## 문제 요약
  현재 각 페이지마다 Tailwind 클래스 조합이 달라 시각적 일관성이 없음.
  예: Home은 `from-blue-50 to-indigo-100`, drama-scene은 인라인 gradient, scenario는 별도 스타일.

  ## 목표
  Dark luxury Japanese learning app 비주얼 시스템 구축.

  ## `tailwind.config.ts` 확장

  ```ts
  theme: {
    extend: {
      colors: {
        // 기존 shadcn 토큰 유지하고 아래 추가
        scene: {
          bg: 'hsl(222, 20%, 7%)',           // 앱 기본 배경 (거의 검정)
          surface: 'hsl(222, 15%, 12%)',      // 카드 배경
          border: 'hsl(222, 12%, 20%)',       // 테두리
          'border-hover': 'hsl(38, 60%, 50%)', // hover 시 amber 테두리
        },
        gold: {
          DEFAULT: 'hsl(38, 70%, 55%)',       // muted gold accent
          dim: 'hsl(38, 50%, 40%)',
          bright: 'hsl(42, 90%, 65%)',
        },
        ivory: {
          DEFAULT: 'hsl(50, 30%, 90%)',       // 기본 텍스트
          muted: 'hsl(50, 15%, 65%)',         // 보조 텍스트
          subtle: 'hsl(50, 10%, 45%)',        // 3차 텍스트
        },
        feedback: {
          natural: 'hsl(152, 60%, 45%)',      // 초록 (Natural)
          clear: 'hsl(207, 70%, 55%)',        // 파랑 (Clear)
          awkward: 'hsl(38, 80%, 55%)',       // 황금 (Slightly awkward)
          retry: 'hsl(280, 60%, 60%)',        // 보라 (Try this)
        }
      },
      backgroundImage: {
        'scene-hero': 'linear-gradient(135deg, hsl(222, 20%, 7%) 0%, hsl(240, 15%, 10%) 100%)',
        'gold-glow': 'radial-gradient(ellipse at center, hsl(38, 70%, 55%, 0.15) 0%, transparent 70%)',
      }
    }
  }
  ```

  ## `client/src/index.css` 추가

  ```css
  /* Dark luxury base */
  :root {
    --font-jp: 'Noto Sans JP', 'Hiragino Sans', sans-serif;
  }

  .scene-bg {
    background: hsl(222, 20%, 7%);
    color: hsl(50, 30%, 90%);
  }

  .scene-card {
    background: hsl(222, 15%, 12%);
    border: 1px solid hsl(222, 12%, 20%);
    border-radius: 16px;
  }

  .scene-card:hover {
    border-color: hsl(38, 60%, 50%);
  }

  .jp-text {
    font-family: var(--font-jp);
    letter-spacing: 0.05em;
    line-height: 1.8;
  }

  .quality-natural  { color: hsl(152, 60%, 45%); }
  .quality-clear    { color: hsl(207, 70%, 55%); }
  .quality-awkward  { color: hsl(38, 80%, 55%); }
  .quality-retry    { color: hsl(280, 60%, 60%); }
  ```

  ## 공통 버튼 variant 추가
  shadcn Button에 커스텀 variant 추가 (`client/src/components/ui/button.tsx`):
  - `ghost-gold`: 투명 배경, gold 텍스트, hover 시 gold/10 배경
  - `scene-action`: 큰 원형 마이크 버튼 스타일

  ## 일본어 폰트
  Noto Sans JP 추가 (`client/index.html`):
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&display=swap" rel="stylesheet">
  ```

  ## 완료 기준
  - tailwind.config.ts에 scene/gold/ivory/feedback 색상 토큰 존재
  - 각 페이지가 같은 배경 컬러 클래스 사용
  - 일본어 텍스트에 .jp-text 클래스 적용 가능
  - 코칭 카드의 quality label이 color-coded

  ## 관련 파일
  - `tailwind.config.ts`
  - `client/src/index.css`
  - `client/index.html` (폰트 링크)
  - `client/src/components/ui/button.tsx`
  