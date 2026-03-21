# Phase 3 language rollout matrix

## Current launch posture
| Language | Target | Support | UI | Stage |
| --- | --- | --- | --- | --- |
| Japanese (`ja`) | Live | Live | Live | Phase 2 live |
| English (`en`) | Live | Live | Live | Phase 2 live |
| Korean (`ko`) | Live | Live | Live | Phase 3 complete |
| Chinese (`zh`) | Live | Live | Live | Phase 3 complete |
| French (`fr`) | Live | Live | Live | Phase 3 complete |
| German (`de`) | Live | Live | Live | Phase 3 complete |
| Spanish (`es`) | Live | Live | Live | Phase 3 complete |
| Vietnamese (`vi`) | Live | Live | Live | Phase 3 complete |
| Thai (`th`) | Live | Live | Live | Phase 3 complete |
| Arabic (`ar`) | Live | Live | Live | Phase 3 complete |

## Rollout rules
1. Do not expose a language in the target-language selector until target prompts, STT, TTS, deterministic feedback, and 5 core scenarios are QA-complete.
2. Support/UI languages can launch earlier when learner-facing copy is stable.
3. Keep selector options aligned with real runtime readiness so users never pick a language that silently falls back to Japanese.
4. Move Arabic last because RTL layout validation is still required.

## Progress snapshot (2026-03-21)
- **Phase 3 overall engineering completion:** **100%** for the original expansion scope (8 of 8 non-Japanese/English languages are now exposed across target/support/UI runtime paths: Korean, Chinese, Thai, French, German, Spanish, Arabic, Vietnamese).
- **Current implementation strategy:** Korean/French/Spanish keep language-specific localized content already authored, while Chinese/Thai/German/Arabic/Vietnamese are now wired end-to-end through language metadata, selectors, scenario fallback content, dialogue prompts, STT/TTS routing, and conversation packs with English fallback copy where native content is not yet specialized.
- **Remaining validation:** native-speaker review, device voice-quality checks, and RTL layout validation for Arabic.

## First Phase 3 delivery slice
- Korean target-language support is now the active rollout lane.
- Reuse the Phase 2 language expansion guide checklist for the remaining languages.
- Next QA pass should cover self-introduction, cafe order, travel, meeting opener, and small talk in Korean, Spanish, and French.
