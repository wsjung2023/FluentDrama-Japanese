# Phase 2 language expansion guide

## Scope covered in this guide
- Language pack structure for Phase 2 tutor flows
- Support-language feedback expectations
- Voice/STT runtime checklist
- Ops metrics to watch before expanding beyond Japanese and English

## Minimum package contract
Every new target language should ship with the following before being marked Phase 2-ready:
- `recognitionPrompt` tuned for Whisper input cleanup
- `initialPrompt` and `systemPrompt` for session bootstrap
- conversation-turn JSON instructions with `response`, `supportTranslation`, `pronunciationGuide`, and `feedback`
- deterministic feedback copy for at least Korean, English, and same-language support
- fallback response for model failures
- pronunciation guide policy (`null` allowed when not helpful)

## Support-language feedback rules
For any new target language:
1. Keep the role-play reply in the target language.
2. Emit `supportTranslation` only when `supportLanguage !== targetLanguage`.
3. Put learner-facing explanation text in `feedback.explanation`.
4. Keep `feedback.correction`, `feedback.betterExpression`, and `feedback.suggestions` in the support language.
5. Preserve `koreanExplanation` as a compatibility mirror only while older clients still read it.

## STT/TTS validation checklist
- Verify `targetLanguage -> speech recognition language` mapping.
- Verify at least one pleasant default voice per gender/style pair.
- Check silence/noise rejection against very short recordings.
- Confirm browser fallback copy is localized on recording failure.
- Confirm pronunciation guide visibility rules per language.

## Scenario rollout checklist
Prioritize these core scenes for each new language:
- self introduction / making a new friend
- cafe order
- asking for directions or travel check-in
- meeting opener
- business small talk

For each scene, review:
- tone and register
- difficulty framework mapping
- learner goal wording
- starter expressions and hint quality

## Ops metrics to instrument
Track these dimensions per session:
- `targetLanguage`
- `supportLanguage`
- `uiLanguage`
- scenario id
- STT success/failure rate
- TTS generation success/failure rate
- average turn count before drop-off
- conversation-start to first-turn conversion rate

## Release gate for a new language
A language can move from draft to launch candidate when all are true:
- typecheck/build pass
- 5 core scenarios reviewed by a human speaker
- deterministic feedback reads naturally in at least one support language
- STT smoke test succeeds with realistic microphone input
- fallback response and recording errors are localized
