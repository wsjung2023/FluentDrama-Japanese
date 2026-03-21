import OpenAI from "openai";
import type { SpeechRecognitionRequest } from "@shared/schema";
import fs from "fs";
import path from "path";
import { getPhase2LanguagePack, getPhase2SpeechRecognitionLanguage } from "./phase2LanguagePack";

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
      language: getPhase2SpeechRecognitionLanguage(language),
      response_format: 'json',
      temperature: 0.0, // Set to 0 to reduce hallucinations
      prompt: getPhase2LanguagePack(language).recognitionPrompt,
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
  topic: string,
  language: "ja" | "en" = "ja"
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

    const phase2Pack = getPhase2LanguagePack(language);
    const prompt = phase2Pack.buildConversationPrompt({
      characterName: character.name,
      topic,
      userInput,
      historyText,
      shouldConsiderEnding,
      supportLanguage: language,
    });

    console.log('Sending prompt to OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: phase2Pack.responseSystemPrompt
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
      response: result.response || phase2Pack.fallbackResponse,
      feedback: result.feedback,
      shouldEndConversation: result.shouldEndConversation || false,
      endingMessage: result.endingMessage
    };
  } catch (error) {
    console.error("Conversation generation failed:", error);
    throw new Error(`Conversation generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}