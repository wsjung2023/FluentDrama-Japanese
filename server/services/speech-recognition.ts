import OpenAI from "openai";
import type { SpeechRecognitionRequest } from "@shared/schema";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function recognizeSpeech(request: SpeechRecognitionRequest): Promise<{ text: string; confidence: number }> {
  const { audioBlob, language } = request;
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioBlob, 'base64');
    
    // Check if audio buffer is too small (likely silence or noise)
    if (audioBuffer.length < 1000) { // Less than 1KB indicates very short/empty audio
      console.log('🔇 Audio buffer too small, likely silence or button click noise');
      throw new Error('Audio too short or silent');
    }
    
    // Create a temporary file for the audio
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilePath = path.join(tempDir, `audio_${Date.now()}.webm`);
    fs.writeFileSync(tempFilePath, audioBuffer);
    
    // Create a readable stream for OpenAI API
    const audioStream = fs.createReadStream(tempFilePath);
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioStream,
      model: "whisper-1",
      language: language === 'ja' ? 'ja' : (language === 'en' ? 'en' : 'ko'), // 일본어 지원 추가
      response_format: 'json',
      temperature: 0.0, // Set to 0 to reduce hallucinations
      prompt: language === 'ja' ? '日本語で話してください。沈黙や雑音は無視してください。' : '', // Reduce hallucinations for Japanese
    });

    // Clean up temporary file
    fs.unlinkSync(tempFilePath);

    const resultText = transcription.text.trim();
    
    // Filter out common Whisper hallucinations and meaningless outputs
    const commonHallucinations = [
      'ふぅ', 'ん', 'あ', 'え', 'う', 'お', 'うん',
      'おしまい', 'ご視聴ありがとう', 'ありがとうございました',
      'Thank you for watching', 'Thanks for watching',
      '시청해주셔서 감사합니다', '감사합니다'
    ];
    
    // Check if result is likely a hallucination
    if (!resultText || 
        resultText.length < 2 || 
        commonHallucinations.some(hall => resultText.includes(hall)) ||
        /^[あいうえおんふぅ]+$/.test(resultText)) {
      console.log('🚫 Detected Whisper hallucination:', resultText);
      throw new Error('Speech recognition detected silence or noise');
    }

    console.log('✅ Valid speech recognized:', resultText);
    return {
      text: resultText,
      confidence: 0.9 // Whisper doesn't provide confidence scores, so we use a default high value
    };
  } catch (error) {
    console.error("Speech recognition failed:", error);
    throw new Error(`Speech recognition failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateConversationResponse(
  userInput: string,
  conversationHistory: Array<{ speaker: string; text: string }>,
  character: { name: string; style: string },
  topic: string
): Promise<{ 
  response: string; 
  feedback?: { 
    accuracy: number; 
    suggestions: string[];
    needsCorrection?: boolean;
    koreanExplanation?: string;
    betterExpression?: string;
  };
  shouldEndConversation?: boolean;
  endingMessage?: string;
}> {
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    console.log('Generating conversation response for:', { userInput, character, topic });
    
    // Build conversation context
    const historyText = conversationHistory
      .slice(-6) // Keep only last 6 exchanges for context
      .map(turn => `${turn.speaker}: ${turn.text}`)
      .join('\n');

    // Check conversation length for ending
    const conversationLength = conversationHistory.length;
    const shouldConsiderEnding = conversationLength >= 10; // After 10 exchanges

    const prompt = `あなたは${character.name}です。${topic}シナリオで自然な人間のキャラクターを演じています。

Previous conversation:
${historyText}

User just said: "${userInput}"

重要な指示:
1. 必ず日本語で返答してください - すべての回答は日本語でなければなりません
2. 自然な日本語の会話スターターを使用してください:
   - "そうですね！", "いいですね！", "なるほど", "そうですか", "実は", "もちろん", "はい", "わかりました", "そういうことですね", "面白いですね", "そうですね", "はい"
3. この状況での実際の人間のように返答してください。正式なアシスタントではありません
4. 回答は短く会話的に (最大1-2文)
5. シナリオを自然に進めてください (料理の注文、チェックイン等)
${shouldConsiderEnding ? '6. この会話を自然に終了すべきかを考慮してください (タスク完了、食事終了等)' : ''}

日本語の文法・発音修正 (ユーザーの日本語に誤りがある場合):
- ユーザーが文法ミスや発音エラーをした場合、"needsCorrection": true にしてください
- 韓国語での説明を提供: "음~ 지금 말한 표현은 정확하지 않아요. 보통 이럴 때는 '正しい日本語表現' 이렇게 말합니다. 다시 해보세요!"
- 理解できるが不自然な日本語の場合: "그렇게 말해도 되지만 이렇게 말하면 더 자연스럽습니다: 'より自然な表現' 이렇게 해보세요"

JSON形式で返答してください:
{
  "response": "自然な日本語での返答",
  "feedback": {
    "accuracy": 85,
    "needsCorrection": false,
    "koreanExplanation": "발음이나 문법 오류시에만 한국어 설명",
    "betterExpression": "必要に応じてより自然な日本語表現", 
    "suggestions": ["簡潔で役立つ日本語のヒント"]
  },
  "shouldEndConversation": false,
  "endingMessage": "shouldEndConversationがtrueの場合の自然な会話終了"
}`;

    console.log('Sending prompt to OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "あなたは日本語会話の先生です。必ず日本語で応答し、有効なJSON形式で'response'と任意の'feedback'フィールドを含めて返答してください。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    console.log('OpenAI response received:', completion.choices[0].message.content);
    
    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      response: result.response || "すみません、よくわかりませんでした。他の言い方で話してみてください。",
      feedback: result.feedback,
      shouldEndConversation: result.shouldEndConversation || false,
      endingMessage: result.endingMessage
    };
  } catch (error) {
    console.error("Conversation generation failed:", error);
    throw new Error(`Conversation generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}