import { useEffect, useId, useRef, useState } from "react";
import { Camera, Loader2, Mic, RotateCcw, Square, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaRecorder } from "@/hooks/use-media-recorder";
import { formatDuration, validateMediaFile, type MediaKind } from "@/lib/media";
import { readableTextColor } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MediaCaptureProps {
  kind: MediaKind;
  /** Longest recording allowed, in seconds. */
  maxDuration?: number;
  /** Called with the recording or uploaded file, and with null when it is removed. */
  onChange: (media: Blob | null) => void;
  /** Brand colour for the main button. */
  accent?: string;
}

const BAR_COUNT = 24;

/** Live microphone level bars, read from the real audio signal. */
function useAudioLevels(stream: MediaStream | null, active: boolean): number[] {
  const [levels, setLevels] = useState<number[]>(() => Array(BAR_COUNT).fill(0));

  useEffect(() => {
    if (!stream || !active) {
      setLevels(Array(BAR_COUNT).fill(0));
      return;
    }
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const context = new AudioCtx();
    const analyser = context.createAnalyser();
    analyser.fftSize = 128;
    context.createMediaStreamSource(stream).connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const step = Math.max(1, Math.floor(data.length / BAR_COUNT));
      setLevels(Array.from({ length: BAR_COUNT }, (_, i) => (data[i * step] ?? 0) / 255));
      frame = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      void context.close();
    };
  }, [stream, active]);

  return levels;
}

/**
 * Record a video or audio testimonial, or upload one.
 *
 * Recording in the browser fails in some in-app browsers and on locked-down
 * devices, so uploading a file is always offered as a second way through.
 */
export function MediaCapture({ kind, maxDuration = 60, onChange, accent }: MediaCaptureProps) {
  const inputId = useId();
  const previewRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState<{ url: string; name: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const recorder = useMediaRecorder({
    kind,
    maxDuration,
    onComplete: (blob) => onChangeRef.current(blob),
  });
  const levels = useAudioLevels(recorder.stream, kind === "audio" && recorder.status === "recording");

  useEffect(() => {
    if (previewRef.current && recorder.stream) previewRef.current.srcObject = recorder.stream;
  }, [recorder.stream, recorder.status]);

  useEffect(
    () => () => {
      if (upload) URL.revokeObjectURL(upload.url);
    },
    [upload],
  );

  const isVideo = kind === "video";
  const Icon = isVideo ? Camera : Mic;
  const noun = isVideo ? "video" : "audio";
  const accentStyle = accent ? { backgroundColor: accent, color: readableTextColor(accent) } : undefined;

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const problem = validateMediaFile(file, kind);
    if (problem) {
      setUploadError(problem);
      return;
    }
    setUploadError(null);
    recorder.reset();
    setUpload({ url: URL.createObjectURL(file), name: file.name });
    onChange(file);
  };

  const clearAll = () => {
    setUpload(null);
    setUploadError(null);
    recorder.reset();
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadControl = (
    <>
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept={isVideo ? "video/*" : "audio/*"}
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <label
        htmlFor={inputId}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md text-sm font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground focus-within:outline focus-within:outline-2 focus-within:outline-ring"
      >
        <Upload className="h-3.5 w-3.5" />
        Upload a {noun} file instead
      </label>
    </>
  );

  // A finished recording or an uploaded file: play it back.
  const playbackUrl = upload?.url ?? (recorder.status === "recorded" ? recorder.url : null);
  if (playbackUrl) {
    return (
      <div className="space-y-3">
        {isVideo ? (
          <video src={playbackUrl} controls playsInline className="aspect-video w-full rounded-xl bg-black object-contain" />
        ) : (
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <audio src={playbackUrl} controls className="w-full" />
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {upload ? `Using ${upload.name}` : `Recorded ${formatDuration(recorder.seconds)}. Play it back, then continue.`}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={clearAll}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            {upload ? "Choose again" : "Record again"}
          </Button>
        </div>
      </div>
    );
  }

  const live = recorder.status === "ready" || recorder.status === "recording";

  if (live) {
    const recording = recorder.status === "recording";
    const progress = Math.min(100, (recorder.seconds / maxDuration) * 100);
    return (
      <div className="space-y-4">
        {isVideo ? (
          <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
            <video ref={previewRef} autoPlay muted playsInline className="h-full w-full -scale-x-100 object-cover" />
            {recording && (
              <>
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-white">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  <span className="text-sm tabular-nums">
                    {formatDuration(recorder.seconds)} / {formatDuration(maxDuration)}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                  <div className="h-full bg-red-500 transition-[width] duration-300" style={{ width: `${progress}%` }} />
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-6">
            <div className="flex h-14 items-center justify-center gap-1" aria-hidden="true">
              {levels.map((level, i) => (
                <span
                  key={i}
                  className={cn("w-1.5 rounded-full transition-[height] duration-75", recording ? "bg-foreground" : "bg-border-hover")}
                  style={{ height: `${8 + level * 44}px` }}
                />
              ))}
            </div>
            <p className="mt-3 text-center text-sm tabular-nums text-muted-foreground" aria-live="off">
              {recording ? `${formatDuration(recorder.seconds)} / ${formatDuration(maxDuration)}` : "Microphone is ready"}
            </p>
          </div>
        )}

        <div className="flex flex-col items-center gap-2">
          {recording ? (
            <Button type="button" size="lg" variant="destructive" onClick={recorder.stop} className="rounded-full px-6">
              <Square className="mr-2 h-4 w-4 fill-current" />
              Stop recording
            </Button>
          ) : (
            <Button type="button" size="lg" onClick={recorder.start} className="rounded-full px-6" style={accentStyle}>
              <span className="mr-2 h-3 w-3 rounded-full bg-red-500" aria-hidden="true" />
              Start recording
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            {recording
              ? "Speak naturally. You can record again if you are not happy with it."
              : `Up to ${maxDuration} seconds. You can play it back before you send it.`}
          </p>
        </div>
      </div>
    );
  }

  const blocked = recorder.status === "denied" || recorder.status === "unsupported" || recorder.status === "error";

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-5 py-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-card">
        {recorder.status === "requesting" ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <Icon className="h-5 w-5 text-foreground" strokeWidth={1.75} />
        )}
      </div>

      {blocked ? (
        <p role="alert" className="mx-auto mb-4 max-w-sm text-sm text-foreground">
          {recorder.error}
        </p>
      ) : (
        <p className="mx-auto mb-4 max-w-sm text-sm text-muted-foreground">
          {recorder.status === "requesting"
            ? "Waiting for permission. Choose Allow when your browser asks."
            : isVideo
              ? "Record right here with your camera. Nothing is sent until you submit."
              : "Record right here with your microphone. Nothing is sent until you submit."}
        </p>
      )}

      <div className="flex flex-col items-center gap-3">
        {recorder.status !== "unsupported" && (
          <Button
            type="button"
            onClick={recorder.enable}
            disabled={recorder.status === "requesting"}
            style={blocked ? undefined : accentStyle}
            variant={blocked ? "outline" : "default"}
          >
            <Icon className="mr-2 h-4 w-4" />
            {blocked ? "Try again" : isVideo ? "Turn on camera" : "Turn on microphone"}
          </Button>
        )}
        {uploadControl}
        {uploadError && (
          <p role="alert" className="text-sm text-destructive">
            {uploadError}
          </p>
        )}
      </div>
    </div>
  );
}
