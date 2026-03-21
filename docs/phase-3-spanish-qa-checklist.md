# Phase 3 Spanish QA checklist

## Goal
Validate the second Phase 3 target-language rollout (`es`) before the next language is promoted.

## Core scenes
- [x] new friend / self introduction
- [x] cafe order
- [x] travel check-in
- [x] meeting opener
- [x] business small talk

## Runtime checklist
- [x] Spanish appears in the target-language selector.
- [x] Spanish scenario cards use Spanish learner expressions and CEFR-style labels.
- [x] Conversation prompts and deterministic feedback support Spanish target language.
- [x] STT maps Spanish input to Spanish recognition settings.
- [x] TTS can reuse the non-Japanese language path for Spanish text.

## Remaining human QA
- Listen to Spanish TTS voice quality on device.
- Review correction tone with a Spanish-native speaker.
- Verify 5 core scenarios feel natural for beginner/intermediate CEFR learners.
