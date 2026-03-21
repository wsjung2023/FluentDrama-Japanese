// Press-to-record hook for microphone capture and server-side speech recognition.
import { useRef, useState } from 'react';
import type { LanguageCode } from '@shared/language';
import { apiRequest, safeJsonParse } from '@/lib/queryClient';
import { getRecorderCopy } from '@/constants/uiCopy';

interface UsePressToRecordOptions {
  language?: LanguageCode;
  onTranscript: (transcript: string) => Promise<void> | void;
  onError: (message: string) => void;
}


function toSupportedRecognitionLanguage(language?: LanguageCode): 'en' | 'ko' | 'ja' | 'fr' | 'es' | 'zh' | 'de' | 'vi' | 'th' | 'ar' {
  if (language === 'en' || language === 'ko' || language === 'ja' || language === 'fr' || language === 'es' || language === 'zh' || language === 'de' || language === 'vi' || language === 'th' || language === 'ar') {
    return language;
  }

  return 'ja';
}

export function usePressToRecord(options: UsePressToRecordOptions) {
  const copy = getRecorderCopy(options.language ?? 'en');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const cleanup = () => {
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      recorderRef.current = null;
      chunksRef.current = [];
    } catch {
      // no-op cleanup guard
    }
  };

  const startRecording = async () => {
    if (isRecording || isProcessing) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.microphoneAccessFailed;
      options.onError(message);
      cleanup();
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current || recorderRef.current.state !== 'recording') return;

    setIsRecording(false);
    setIsProcessing(true);

    try {
      await new Promise<void>((resolve) => {
        const recorder = recorderRef.current;
        if (!recorder) {
          resolve();
          return;
        }
        recorder.onstop = () => resolve();
        recorder.stop();
      });

      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const base64Audio = await new Promise<string>((resolve, reject) => {
        try {
          const reader = new FileReader();
          reader.onloadend = () => {
            try {
              const raw = String(reader.result || '');
              const payload = raw.split(',')[1] || '';
              resolve(payload);
            } catch {
              reject(new Error(copy.audioEncodingFailed));
            }
          };
          reader.onerror = () => reject(new Error(copy.audioReadFailed));
          reader.readAsDataURL(audioBlob);
        } catch {
          reject(new Error(copy.audioConversionFailed));
        }
      });

      if (!base64Audio) {
        throw new Error(copy.emptyRecording);
      }

      const recognitionResponse = await safeJsonParse(
        await apiRequest('POST', '/api/speech-recognition', {
          audioBlob: base64Audio,
          language: toSupportedRecognitionLanguage(options.language),
        }),
      );
      const transcript = (recognitionResponse as { text?: string }).text?.trim() ?? '';
      if (!transcript) {
        throw new Error(copy.noSpeechRecognized);
      }

      await options.onTranscript(transcript);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.speechProcessingFailed;
      options.onError(message);
    } finally {
      cleanup();
      setIsProcessing(false);
    }
  };

  return { isRecording, isProcessing, startRecording, stopRecording };
}
