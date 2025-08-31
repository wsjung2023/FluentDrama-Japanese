import type { TTSRequest } from "@shared/schema";

// Supertone voice mapping for Japanese learning
// Using actual Supertone voice IDs from the API
const VOICE_MAP = {
  'female_friendly': '91992bbd4758bdcf9c9b01',    // Adam (male but works as fallback)
  'male_calm': '91992bbd4758bdcf9c9b01',          // Adam - young adult male voice
  'business_formal': '91992bbd4758bdcf9c9b01',    // Adam for all - we'll get more voices later
  'female_cheerful': '91992bbd4758bdcf9c9b01'     // Adam for all - need to get female voices
};

export async function generateTTS(request: TTSRequest): Promise<{ audioUrl: string }> {
  const { text, voiceId } = request;
  
  const supertoneApiKey = process.env.SUPERTONE_API_KEY;
  
  if (!supertoneApiKey) {
    console.warn("Supertone API key not configured - returning placeholder audio");
    return generatePlaceholderAudio(text);
  }

  // Map custom voice ID to Supertone voice ID
  const supertoneVoiceId = VOICE_MAP[voiceId as keyof typeof VOICE_MAP] || VOICE_MAP.female_friendly;

  try {
    // Using correct Supertone API endpoint
    const response = await fetch(`https://supertoneapi.com/v1/text-to-speech/${supertoneVoiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sup-api-key': supertoneApiKey
      },
      body: JSON.stringify({
        text: text,
        language: 'ja',
        style: 'neutral',
        model: 'sona_speech_1',
        output_format: 'wav',
        voice_settings: {
          pitch_shift: 0,
          pitch_variance: 1,
          speed: 1
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Supertone API error: ${response.status} - ${errorText}`);
      throw new Error(`Supertone API error: ${response.status} - ${errorText}`);
    }

    // Supertone API returns binary audio data directly
    const audioBuffer = await response.arrayBuffer();
    
    // Get audio length from header if available
    const audioLength = response.headers.get('X-Audio-Length');
    if (audioLength) {
      console.log(`Generated audio length: ${audioLength} seconds`);
    }
    
    // Convert to base64 for transmission
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/wav;base64,${audioBase64}`;
    
    return { audioUrl };
  } catch (error) {
    console.error("Supertone TTS generation failed:", error);
    
    // If network error (DNS resolution, etc.), provide fallback
    if (error instanceof Error && (
      error.message.includes('ENOTFOUND') || 
      error.message.includes('fetch failed') ||
      error.message.includes('network')
    )) {
      console.warn("Network error detected, returning placeholder audio");
      return generatePlaceholderAudio(text);
    }
    
    throw new Error(`TTS generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Generate a simple placeholder audio for development/fallback
function generatePlaceholderAudio(text: string): { audioUrl: string } {
  // Create a simple silent audio placeholder
  const silentWav = generateSilentWav(text.length * 100); // ~100ms per character
  return { 
    audioUrl: `data:audio/wav;base64,${silentWav}` 
  };
}

// Generate minimal WAV file (silent audio) for fallback
function generateSilentWav(durationMs: number): string {
  const sampleRate = 22050;
  const samples = Math.floor(sampleRate * durationMs / 1000);
  const dataSize = samples * 2; // 16-bit samples
  
  // WAV file header (44 bytes) + silent audio data
  const buffer = Buffer.alloc(44 + dataSize);
  let offset = 0;
  
  // RIFF header
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(36 + dataSize, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;
  
  // fmt chunk
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4; // chunk size
  buffer.writeUInt16LE(1, offset); offset += 2;  // audio format (PCM)
  buffer.writeUInt16LE(1, offset); offset += 2;  // num channels
  buffer.writeUInt32LE(sampleRate, offset); offset += 4; // sample rate
  buffer.writeUInt32LE(sampleRate * 2, offset); offset += 4; // byte rate
  buffer.writeUInt16LE(2, offset); offset += 2;  // block align
  buffer.writeUInt16LE(16, offset); offset += 2; // bits per sample
  
  // data chunk
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;
  
  // Silent audio data (all zeros)
  buffer.fill(0, offset);
  
  return buffer.toString('base64');
}
