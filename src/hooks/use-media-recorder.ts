import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseMediaRecorderOptions {
  type: 'video' | 'audio';
  maxDuration?: number; // in seconds
  onRecordingComplete?: (blob: Blob, url: string) => void;
}

export interface UseMediaRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  mediaUrl: string | null;
  mediaBlob: Blob | null;
  error: string | null;
  hasPermission: boolean | null;
  stream: MediaStream | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
  requestPermission: () => Promise<boolean>;
}

export function useMediaRecorder({
  type,
  maxDuration = 120,
  onRecordingComplete,
}: UseMediaRecorderOptions): UseMediaRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
    chunksRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [cleanup, mediaUrl]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: type === 'video' ? { facingMode: 'user', width: 1280, height: 720 } : false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Store stream for preview
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setHasPermission(true);
      setError(null);
      
      return true;
    } catch (err) {
      console.error('Permission error:', err);
      setHasPermission(false);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Permission denied. Please allow access to your camera/microphone.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera/microphone found. Please connect a device.');
        } else {
          setError(`Error: ${err.message}`);
        }
      }
      
      return false;
    }
  }, [type]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Use existing stream or request new one
      let mediaStream = streamRef.current;
      if (!mediaStream) {
        const granted = await requestPermission();
        if (!granted) return;
        mediaStream = streamRef.current;
      }

      if (!mediaStream) {
        setError('Failed to get media stream');
        return;
      }

      // Clean up previous recording
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
        setMediaUrl(null);
        setMediaBlob(null);
      }

      chunksRef.current = [];
      
      // Determine MIME type
      const mimeType = type === 'video' 
        ? (MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm')
        : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4');

      const recorder = new MediaRecorder(mediaStream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        setMediaBlob(blob);
        setMediaUrl(url);
        setIsRecording(false);
        setIsPaused(false);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        onRecordingComplete?.(blob, url);
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed. Please try again.');
        cleanup();
      };

      // Start recording
      recorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);

    } catch (err) {
      console.error('Start recording error:', err);
      setError('Failed to start recording. Please try again.');
    }
  }, [type, maxDuration, mediaUrl, requestPermission, onRecordingComplete, cleanup]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    }
  }, [maxDuration, stopRecording]);

  const resetRecording = useCallback(() => {
    stopRecording();
    
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
    }
    
    setMediaUrl(null);
    setMediaBlob(null);
    setRecordingTime(0);
    setError(null);
    chunksRef.current = [];
  }, [stopRecording, mediaUrl]);

  return {
    isRecording,
    isPaused,
    recordingTime,
    mediaUrl,
    mediaBlob,
    error,
    hasPermission,
    stream,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    requestPermission,
  };
}
