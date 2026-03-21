# Phase 3 French QA checklist

## Goal
Validate the third Phase 3 target-language rollout (`fr`) before the next language is promoted.

## Core scenes
- [x] new friend / self introduction
- [x] cafe order
- [x] travel check-in
- [x] meeting opener
- [x] business small talk

## Runtime checklist
- [x] French appears in the target-language selector.
- [x] French scenario cards use French learner expressions and CEFR-style labels.
- [x] Conversation prompts and deterministic feedback support French target language.
- [x] STT maps French input to French recognition settings.
- [x] TTS can reuse the non-Japanese language path for French text.

## Remaining human QA
- Listen to French TTS voice quality on device.
- Review correction tone with a French-native speaker.
- Verify 5 core scenarios feel natural for beginner/intermediate CEFR learners.
