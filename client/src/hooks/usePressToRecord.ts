// Press-to-record hook for microphone capture and server-side speech recognition.
import { useRef, useState } from 'react';
import { apiRequest, safeJsonParse } from '@/lib/queryClient';

interface UsePressToRecordOptions {
  language?: 'en' | 'ko' | 'ja';
  onTranscript: (transcript: string) => Promise<void> | void;
  onError: (message: string) => void;
}

export function usePressToRecord(options: UsePressToRecordOptions) {
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
      const message = error instanceof Error ? error.message : '마이크 접근에 실패했습니다.';
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
              reject(new Error('오디오 인코딩에 실패했습니다.'));
            }
          };
          reader.onerror = () => reject(new Error('오디오 파일 읽기에 실패했습니다.'));
          reader.readAsDataURL(audioBlob);
        } catch {
          reject(new Error('오디오 변환에 실패했습니다.'));
        }
      });

      if (!base64Audio) {
        throw new Error('녹음 데이터가 비어 있습니다.');
      }

      const recognitionResponse = await safeJsonParse(
        await apiRequest('POST', '/api/speech-recognition', {
          audioBlob: base64Audio,
          language: options.language ?? 'ja',
        }),
      );
      const transcript = (recognitionResponse as { text?: string }).text?.trim() ?? '';
      if (!transcript) {
        throw new Error('음성을 인식하지 못했습니다. 다시 시도해주세요.');
      }

      await options.onTranscript(transcript);
    } catch (error) {
      const message = error instanceof Error ? error.message : '음성 처리에 실패했습니다.';
      options.onError(message);
    } finally {
      cleanup();
      setIsProcessing(false);
    }
  };

  return { isRecording, isProcessing, startRecording, stopRecording };
}
