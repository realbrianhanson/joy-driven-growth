import { useCallback, useEffect, useRef, useState } from "react";
import { pickRecorderMimeType, type MediaKind } from "@/lib/media";

export type RecorderStatus =
  | "idle"
  | "requesting"
  | "ready"
  | "recording"
  | "recorded"
  | "denied"
  | "unsupported"
  | "error";

interface Options {
  kind: MediaKind;
  /** Hard stop, in seconds. */
  maxDuration?: number;
  onComplete?: (blob: Blob) => void;
}

export function canRecordInBrowser(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    typeof MediaRecorder !== "undefined"
  );
}

/**
 * Camera and microphone recording as a small state machine.
 *
 * idle → requesting → ready → recording → recorded, with denied, unsupported
 * and error as the places it can stop. The camera turns off as soon as a
 * recording finishes, so the light is never left on.
 */
export function useMediaRecorder({ kind, maxDuration = 120, onComplete }: Options) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [seconds, setSeconds] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const urlRef = useRef<string | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const releaseUrl = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  };

  useEffect(
    () => () => {
      clearTimer();
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.onstop = null;
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      releaseUrl();
    },
    [],
  );

  const enable = useCallback(async (): Promise<boolean> => {
    if (!canRecordInBrowser()) {
      setStatus("unsupported");
      setError("This browser cannot record here. Upload a file instead.");
      return false;
    }
    setStatus("requesting");
    setError(null);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: kind === "video" ? { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      });
      streamRef.current = media;
      setStream(media);
      setStatus("ready");
      return true;
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      const device = kind === "video" ? "camera and microphone" : "microphone";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setStatus("denied");
        setError(`Access to your ${device} is blocked. Allow it in your browser settings, or upload a file instead.`);
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setStatus("error");
        setError(`No ${device} found on this device. Upload a file instead.`);
      } else {
        setStatus("error");
        setError(`Could not start your ${device}. Close other apps that use it and try again.`);
      }
      return false;
    }
  }, [kind]);

  const stop = useCallback(() => {
    clearTimer();
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (!streamRef.current) {
      const ok = await enable();
      if (!ok) return;
    }
    const media = streamRef.current;
    if (!media) return;

    try {
      const mimeType = pickRecorderMimeType(kind, (type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(media, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onerror = () => {
        clearTimer();
        releaseStream();
        setStatus("error");
        setError("The recording stopped unexpectedly. Try again, or upload a file instead.");
      };

      recorder.onstop = () => {
        clearTimer();
        const type = recorder.mimeType || mimeType || (kind === "video" ? "video/mp4" : "audio/mp4");
        const recorded = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        releaseStream();
        if (recorded.size === 0) {
          setStatus("error");
          setError("Nothing was recorded. Try again, or upload a file instead.");
          return;
        }
        releaseUrl();
        urlRef.current = URL.createObjectURL(recorded);
        setBlob(recorded);
        setUrl(urlRef.current);
        setStatus("recorded");
        onCompleteRef.current?.(recorded);
      };

      startedAtRef.current = Date.now();
      setSeconds(0);
      recorder.start(1000);
      setStatus("recording");

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setSeconds(Math.min(elapsed, maxDuration));
        if (elapsed >= maxDuration) stop();
      }, 250);
    } catch {
      releaseStream();
      setStatus("error");
      setError("This browser could not start recording. Upload a file instead.");
    }
  }, [enable, kind, maxDuration, releaseStream, stop]);

  /** Throw away the recording and go back to the start. */
  const reset = useCallback(() => {
    clearTimer();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    chunksRef.current = [];
    releaseStream();
    releaseUrl();
    setBlob(null);
    setUrl(null);
    setSeconds(0);
    setError(null);
    setStatus("idle");
  }, [releaseStream]);

  return { status, seconds, stream, blob, url, error, enable, start, stop, reset };
}
