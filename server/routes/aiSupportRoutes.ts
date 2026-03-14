// AI support routes for background prompts, translation/pronunciation help, and speech recognition.
import type { Express } from "express";
import { z } from "zod";
import { recognizeSpeech } from "../services/speech-recognition";
import { requireAuthenticated } from "./middleware/authGuard";
import { getErrorMessage, getErrorStatus } from "../lib/apiError";
import { parseOrThrow } from "../lib/validate";
import { logError } from "../lib/logger";

const characterStyleSchema = z.enum(['cheerful', 'calm', 'strict']);
const characterGenderSchema = z.enum(['male', 'female']);

export function registerAiSupportRoutes(app: Express) {
  app.post('/api/generate-background-prompt', async (req: any, res) => {
    if (!requireAuthenticated(req, res)) {
      return;
    }

    try {
      const backgroundSchema = z.object({
        customScenarioText: z.string().min(1, 'Custom scenario text is required'),
        characterStyle: characterStyleSchema.optional(),
        characterGender: characterGenderSchema.optional(),
      });
      const { customScenarioText, characterStyle, characterGender } = parseOrThrow(backgroundSchema, req.body);

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `당신은 일본어 학습 앱의 캐릭터 이미지 생성을 위한 배경 프롬프트 전문가입니다.
주어진 커스텀 시나리오를 분석하여 다음을 생성하세요:
1. 배경 환경 설명 (영어)
2. 상황에 맞는 복장/의상 설명 (영어)
3. 캐릭터의 자세/포즈 제안 (영어)
4. 전체적인 분위기/조명 설명 (영어)

JSON 형식으로 응답하세요: {
"backgroundSetting": "배경 환경",
"appropriateOutfit": "적절한 복장",
"characterPose": "캐릭터 포즈",
"atmosphere": "분위기/조명",
"combinedPrompt": "모든 요소를 결합한 완전한 프롬프트"
}`,
            },
            {
              role: 'user',
              content: `커스텀 시나리오: "${customScenarioText}"
캐릭터 스타일: ${characterStyle || 'cheerful'}
캐릭터 성별: ${characterGender || 'female'}

이 시나리오에 맞는 배경, 복장, 포즈, 분위기를 제안해주세요.`,
            },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const result = await openaiResponse.json();
      const content = JSON.parse(result.choices[0].message.content);

      res.json({
        ...content,
        message: '배경 프롬프트가 생성되었습니다!',
      });
    } catch (error) {
      logError('Background prompt generation error', error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, '배경 프롬프트 생성 중 오류가 발생했습니다.');
      res.status(status).json({
        message,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.post('/api/translate-pronunciation', async (req: any, res) => {
    if (!requireAuthenticated(req, res)) {
      return;
    }

    try {
      const translateSchema = z.object({ text: z.string().min(1, 'Text is required') });
      const { text } = parseOrThrow(translateSchema, req.body);

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content:
                "You are a Japanese language assistant. For Japanese text, provide Korean translation and romanized pronunciation. Respond in JSON format with 'koreanTranslation' and 'pronunciation' fields.",
            },
            {
              role: 'user',
              content: `Provide Korean translation and romanized pronunciation for this Japanese text: "${text}"`,
            },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 300,
          temperature: 0.3,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const result = await openaiResponse.json();
      const content = JSON.parse(result.choices[0].message.content);

      res.json({
        koreanTranslation: content.koreanTranslation || '',
        pronunciation: content.pronunciation || '',
        message: '번역 및 발음이 생성되었습니다!',
      });
    } catch (error) {
      logError('Translation/pronunciation generation error', error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, '번역 및 발음 생성 중 오류가 발생했습니다.');
      res.status(status).json({
        message,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.post('/api/speech-recognition', async (req: any, res) => {
    if (!requireAuthenticated(req, res)) {
      return;
    }

    try {
      const speechSchema = z.object({
        audioBlob: z.string().min(1, 'Audio data is required'),
        language: z.enum(['en', 'ko', 'ja']).optional(),
      });
      const { audioBlob, language } = parseOrThrow(speechSchema, req.body);

      const result = await recognizeSpeech({ audioBlob, language: language || 'ja' });

      res.json({
        text: result.text,
        confidence: result.confidence,
        message: '음성 인식이 완료되었습니다!',
      });
    } catch (error) {
      logError('Speech recognition error', error);
      const status = getErrorStatus(error);
      const message = getErrorMessage(error, '음성 인식 중 오류가 발생했습니다.');
      res.status(status).json({
        message,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
