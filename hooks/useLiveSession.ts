import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveSession, LiveServerMessage } from '@google/genai';
import { createBlob, decode, decodeAudioData } from '../services/audioUtils';
import { TranscriptionEntry } from '../types';

export enum ConnectionState {
  IDLE,
  CONNECTING,
  CONNECTED,
  ERROR,
  CLOSED,
}

export const useLiveSession = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.IDLE
  );
  const [transcription, setTranscription] = useState<TranscriptionEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const nextStartTimeRef = useRef(0);
  
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  const cleanup = useCallback(() => {
    scriptProcessorRef.current?.disconnect();
    scriptProcessorRef.current = null;
    
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;

    inputAudioContextRef.current?.close();
    inputAudioContextRef.current = null;
    
    outputAudioContextRef.current?.close();
    outputAudioContextRef.current = null;

    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();

    sessionPromiseRef.current = null;

    setConnectionState(ConnectionState.IDLE);
    setIsModelSpeaking(false);
  }, []);

  const endSession = useCallback(async () => {
    setConnectionState(ConnectionState.CLOSED);
    if (sessionPromiseRef.current) {
        try {
            const session = await sessionPromiseRef.current;
            session.close();
        } catch (e) {
            console.error('Error closing session:', e);
        }
    }
    cleanup();
  }, [cleanup]);
  
  useEffect(() => {
      return () => {
          endSession();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSession = useCallback(async () => {
    if (connectionState !== ConnectionState.IDLE && connectionState !== ConnectionState.CLOSED) {
      return;
    }
    
    setConnectionState(ConnectionState.CONNECTING);
    setError(null);
    setTranscription([]);
    currentInputTranscriptionRef.current = '';
    currentOutputTranscriptionRef.current = '';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
            systemInstruction: 'You are a friendly and helpful AI assistant. Keep your responses concise and conversational.',
            inputAudioTranscription: {},
            outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setConnectionState(ConnectionState.CONNECTED);
            // FIX: Use `(window as any).webkitAudioContext` for cross-browser compatibility.
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            // FIX: Use `(window as any).webkitAudioContext` for cross-browser compatibility.
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              // FIX: Per guideline, rely solely on promise resolution to send data.
              // The conditional check is removed to avoid race conditions and a non-null assertion is used.
              sessionPromiseRef.current!.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle transcriptions
            if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                currentInputTranscriptionRef.current += text;
                setTranscription(prev => {
                    const last = prev[prev.length - 1];
                    if (last && last.speaker === 'user' && !last.isFinal) {
                        return [...prev.slice(0, -1), { ...last, text: currentInputTranscriptionRef.current }];
                    }
                    return [...prev, { id: `user-${Date.now()}`, speaker: 'user', text: currentInputTranscriptionRef.current, isFinal: false }];
                });
            }
            if (message.serverContent?.outputTranscription) {
                const text = message.serverContent.outputTranscription.text;
                currentOutputTranscriptionRef.current += text;
                 setTranscription(prev => {
                    const last = prev[prev.length - 1];
                    if (last && last.speaker === 'model' && !last.isFinal) {
                        return [...prev.slice(0, -1), { ...last, text: currentOutputTranscriptionRef.current }];
                    }
                    return [...prev, { id: `model-${Date.now()}`, speaker: 'model', text: currentOutputTranscriptionRef.current, isFinal: false }];
                });
            }

            // Handle audio playback
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              setIsModelSpeaking(true);
              const outputAudioContext = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContext.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) {
                  setIsModelSpeaking(false);
                }
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Finalize turn
            if (message.serverContent?.turnComplete) {
                setTranscription(prev => prev.map(t => ({...t, isFinal: true})));
                currentInputTranscriptionRef.current = '';
                currentOutputTranscriptionRef.current = '';
            }

            // Handle interruption
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(source => source.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsModelSpeaking(false);
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('API Error:', e);
            setError(`Connection error: ${e.message}`);
            setConnectionState(ConnectionState.ERROR);
            cleanup();
          },
          onclose: () => {
            setConnectionState(ConnectionState.CLOSED);
            cleanup();
          },
        },
      });
    } catch (err) {
      console.error('Failed to start session:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setConnectionState(ConnectionState.ERROR);
      cleanup();
    }
  }, [cleanup, connectionState]);

  return { startSession, endSession, connectionState, transcription, error, isModelSpeaking };
};
