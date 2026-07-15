import { useState, useRef, useCallback } from "react";

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  error: string | null;
}

export function useScreenRecording() {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Iniciar gravação do ecrã + áudio
  const startRecording = useCallback(async (videoElement?: HTMLVideoElement) => {
    try {
      setState(prev => ({ ...prev, error: null }));

      // Capturar o ecrã (canvas do LiveKit)
      let screenStream: MediaStream;

      if (videoElement) {
        // Usar canvas para capturar o vídeo do elemento
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Falha ao obter contexto do canvas");

        canvas.width = videoElement.videoWidth || 1280;
        canvas.height = videoElement.videoHeight || 720;

        // Criar stream do canvas
        const canvasStream = (canvas as any).captureStream(30); // 30 FPS
        screenStream = canvasStream;

        // Animar canvas com o vídeo
        const drawFrame = () => {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(drawFrame);
        };
        drawFrame();
      } else {
        // Capturar ecrã do utilizador (alternativa)
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
      }

      // Capturar áudio do sistema + microfone
      let audioStream: MediaStream;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        console.warn("Microfone não disponível, gravando apenas vídeo");
        audioStream = new MediaStream();
      }

      // Combinar streams
      const combinedStream = new MediaStream();
      screenStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));
      audioStream.getAudioTracks().forEach(track => combinedStream.addTrack(track));

      streamRef.current = combinedStream;

      // Criar MediaRecorder
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: "video/webm;codecs=vp9,opus",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        setState(prev => ({
          ...prev,
          error: `Erro na gravação: ${event.error}`,
          isRecording: false,
        }));
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
      }));

      // Iniciar timer
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      setState(prev => ({
        ...prev,
        error: `Falha ao iniciar gravação: ${message}`,
      }));
    }
  }, []);

  // Pausar gravação
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [state.isRecording]);

  // Retomar gravação
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isPaused) {
      mediaRecorderRef.current.resume();
      setState(prev => ({ ...prev, isPaused: false }));
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);
    }
  }, [state.isPaused]);

  // Parar gravação e retornar Blob
  const stopRecording = useCallback(
    async (): Promise<Blob | null> => {
      return new Promise((resolve) => {
        if (!mediaRecorderRef.current) {
          resolve(null);
          return;
        }

        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          chunksRef.current = [];
          resolve(blob);
        };

        mediaRecorderRef.current.stop();
        streamRef.current?.getTracks().forEach(track => track.stop());

        if (timerRef.current) clearInterval(timerRef.current);

        setState(prev => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          duration: 0,
        }));
      });
    },
    []
  );

  // Fazer upload do vídeo para R2
  const uploadRecording = useCallback(
    async (blob: Blob, filename: string, authToken: string): Promise<string | null> => {
      try {
        const formData = new FormData();
        formData.append("file", blob, filename);

        const res = await fetch("/api/livekit/recording/upload", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Falha no upload");
        }

        return data.recordingUrl;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        setState(prev => ({
          ...prev,
          error: `Falha no upload: ${message}`,
        }));
        return null;
      }
    },
    []
  );

  return {
    ...state,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    uploadRecording,
  };
}
