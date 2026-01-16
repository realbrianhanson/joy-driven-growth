import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle, RotateCcw, Check, Play, Pause } from 'lucide-react';
import { useMediaRecorder } from '@/hooks/use-media-recorder';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioRecorderProps {
  maxDuration?: number;
  onRecordingComplete: (blob: Blob, url: string) => void;
  onCancel?: () => void;
}

export function AudioRecorder({ 
  maxDuration = 120, 
  onRecordingComplete,
  onCancel 
}: AudioRecorderProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(8));
  const [isPlaying, setIsPlaying] = useState(false);

  const {
    isRecording,
    recordingTime,
    mediaUrl,
    mediaBlob,
    error,
    hasPermission,
    stream,
    startRecording,
    stopRecording,
    resetRecording,
    requestPermission,
  } = useMediaRecorder({
    type: 'audio',
    maxDuration,
    onRecordingComplete,
  });

  // Audio visualization
  useEffect(() => {
    if (stream && isRecording) {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 64;
      source.connect(analyzer);
      analyzerRef.current = analyzer;

      const dataArray = new Uint8Array(analyzer.frequencyBinCount);

      const updateLevels = () => {
        if (!analyzerRef.current) return;
        
        analyzerRef.current.getByteFrequencyData(dataArray);
        
        // Sample 20 frequency bands
        const levels: number[] = [];
        const step = Math.floor(dataArray.length / 20);
        for (let i = 0; i < 20; i++) {
          const value = dataArray[i * step] || 0;
          // Scale to reasonable height (8-48px)
          levels.push(Math.max(8, (value / 255) * 48));
        }
        setAudioLevels(levels);
        
        animationRef.current = requestAnimationFrame(updateLevels);
      };

      updateLevels();

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        audioContext.close();
      };
    } else {
      setAudioLevels(Array(20).fill(8));
    }
  }, [stream, isRecording]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConfirm = () => {
    if (mediaBlob && mediaUrl) {
      onRecordingComplete(mediaBlob, mediaUrl);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Initial permission request state
  if (hasPermission === null) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Mic className="w-10 h-10 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium mb-2">Tell us in your own words 🎤</p>
        <p className="text-sm text-muted-foreground mb-6">
          We need access to your microphone
        </p>
        <Button onClick={requestPermission} className="gradient-sunny">
          <Mic className="w-4 h-4 mr-2" />
          Enable Microphone
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} className="ml-2">
            Cancel
          </Button>
        )}
      </div>
    );
  }

  // Permission denied
  if (hasPermission === false) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
          <Mic className="w-10 h-10 text-destructive" />
        </div>
        <p className="text-lg font-medium mb-2">Microphone access needed</p>
        <p className="text-sm text-muted-foreground mb-4">
          {error || 'Please allow microphone access in your browser settings'}
        </p>
        <Button onClick={requestPermission} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  // Show playback if recording is complete
  if (mediaUrl && !isRecording) {
    return (
      <div className="space-y-6">
        <div className="bg-muted/50 rounded-2xl p-6">
          <audio 
            ref={audioRef} 
            src={mediaUrl} 
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
          
          <div className="flex items-center gap-4">
            <Button
              onClick={togglePlayback}
              className="h-14 w-14 rounded-full gradient-sunny"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-1" />
              )}
            </Button>
            
            <div className="flex-1">
              <div className="flex items-center gap-1 h-12">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-primary/60 rounded-full"
                    style={{
                      height: `${Math.random() * 32 + 8}px`,
                    }}
                  />
                ))}
              </div>
            </div>
            
            <span className="font-mono text-sm text-muted-foreground">
              {formatTime(recordingTime)}
            </span>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={resetRecording}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Re-record
          </Button>
          <Button onClick={handleConfirm} className="gradient-sunny">
            <Check className="w-4 h-4 mr-2" />
            Use This Audio
          </Button>
        </div>
      </div>
    );
  }

  // Recording interface
  return (
    <div className="space-y-6 text-center">
      <p className="text-lg font-medium">Tell us in your own words 🎤</p>
      
      {/* Waveform visualization */}
      <div className="flex items-center justify-center gap-1 h-16">
        {audioLevels.map((height, i) => (
          <motion.div
            key={i}
            className={`w-1.5 rounded-full ${isRecording ? 'bg-primary' : 'bg-muted-foreground/30'}`}
            animate={{ height }}
            transition={{ duration: 0.1 }}
          />
        ))}
      </div>

      {/* Recording time */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-3xl font-mono text-primary"
          >
            {formatTime(recordingTime)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main record button */}
      <div className="flex justify-center">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          className={`h-24 w-24 rounded-full transition-all ${
            isRecording
              ? 'bg-destructive hover:bg-destructive/90 animate-pulse'
              : 'gradient-sunny hover:scale-105'
          }`}
        >
          {isRecording ? (
            <StopCircle className="w-12 h-12" />
          ) : (
            <Mic className="w-12 h-12" />
          )}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {isRecording 
          ? `Recording... (max ${maxDuration}s)`
          : 'Tap to start recording'
        }
      </p>
    </div>
  );
}
