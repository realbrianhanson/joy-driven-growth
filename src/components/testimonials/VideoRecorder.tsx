import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Video, StopCircle, RotateCcw, Check, Camera } from 'lucide-react';
import { useMediaRecorder } from '@/hooks/use-media-recorder';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoRecorderProps {
  maxDuration?: number;
  onRecordingComplete: (blob: Blob, url: string) => void;
  onCancel?: () => void;
}

export function VideoRecorder({ 
  maxDuration = 60, 
  onRecordingComplete,
  onCancel 
}: VideoRecorderProps) {
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const videoPlaybackRef = useRef<HTMLVideoElement>(null);

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
    type: 'video',
    maxDuration,
    onRecordingComplete,
  });

  // Connect stream to preview video element
  useEffect(() => {
    if (stream && videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = stream;
    }
  }, [stream]);

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

  // Initial permission request state
  if (hasPermission === null) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Camera className="w-10 h-10 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium mb-2">Ready for your close-up? 📹</p>
        <p className="text-sm text-muted-foreground mb-6">
          We need access to your camera and microphone
        </p>
        <Button onClick={requestPermission} className="gradient-sunny">
          <Camera className="w-4 h-4 mr-2" />
          Enable Camera
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
          <Camera className="w-10 h-10 text-destructive" />
        </div>
        <p className="text-lg font-medium mb-2">Camera access needed</p>
        <p className="text-sm text-muted-foreground mb-4">
          {error || 'Please allow camera access in your browser settings'}
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
      <div className="space-y-4">
        <div className="aspect-video bg-black rounded-2xl overflow-hidden">
          <video
            ref={videoPlaybackRef}
            src={mediaUrl}
            controls
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={resetRecording}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Re-record
          </Button>
          <Button onClick={handleConfirm} className="gradient-sunny">
            <Check className="w-4 h-4 mr-2" />
            Use This Video
          </Button>
        </div>
      </div>
    );
  }

  // Recording interface
  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
        {/* Live preview */}
        <video
          ref={videoPreviewRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover mirror"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Recording indicator */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 left-4 flex items-center gap-2 bg-destructive/90 text-destructive-foreground px-3 py-1.5 rounded-full"
            >
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="font-mono text-sm">{formatTime(recordingTime)}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        {isRecording && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: '0%' }}
              animate={{ width: `${(recordingTime / maxDuration) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}

        {/* Centered record/stop button */}
        {!isRecording && !mediaUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Button
              onClick={startRecording}
              className="h-20 w-20 rounded-full bg-destructive hover:bg-destructive/90 shadow-lg"
            >
              <Video className="w-10 h-10" />
            </Button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        {isRecording ? (
          <Button onClick={stopRecording} variant="outline" size="lg" className="rounded-full">
            <StopCircle className="w-5 h-5 mr-2" />
            Stop Recording
          </Button>
        ) : (
          <Button onClick={startRecording} className="gradient-sunny rounded-full" size="lg">
            <Video className="w-5 h-5 mr-2" />
            Start Recording
          </Button>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        💡 Tip: Good lighting helps! Max {maxDuration} seconds.
      </p>
    </div>
  );
}
