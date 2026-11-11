export type MediaKind = "video" | "audio";

/**
 * Recording formats in order of preference.
 *
 * MP4 comes first because it plays in every browser. Safari on iPhone cannot
 * record WebM at all, and older iPhones cannot play it, so a WebM-only recorder
 * breaks video testimonials for most people on a phone.
 */
const RECORDER_CANDIDATES: Record<MediaKind, string[]> = {
  video: [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ],
  audio: ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"],
};

/** The first format this browser can record. Undefined means "let the browser choose". */
export function pickRecorderMimeType(kind: MediaKind, isSupported: (type: string) => boolean): string | undefined {
  return RECORDER_CANDIDATES[kind].find((type) => {
    try {
      return isSupported(type);
    } catch {
      return false;
    }
  });
}

/** "video/webm;codecs=vp9,opus" becomes "video/webm". */
export function baseMimeType(mime: string | null | undefined): string {
  return (mime ?? "").split(";")[0].trim().toLowerCase();
}

const EXTENSIONS: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/x-matroska": "mkv",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** File extension that matches the real container, so the stored file plays back. */
export function extensionForMime(mime: string | null | undefined, kind: MediaKind): string {
  const base = baseMimeType(mime);
  if (EXTENSIONS[base]) return EXTENSIONS[base];
  return kind === "video" ? "mp4" : "m4a";
}

/** Content type to store. Falls back to a sensible default when the browser reports none. */
export function contentTypeFor(mime: string | null | undefined, kind: MediaKind): string {
  const base = baseMimeType(mime);
  if (base.startsWith(`${kind}/`)) return base;
  // Safari reports audio-only MP4 recordings as video/mp4 in some versions.
  if (kind === "audio" && base === "video/mp4") return "audio/mp4";
  return kind === "video" ? "video/mp4" : "audio/mp4";
}

export const MAX_MEDIA_BYTES = 100 * 1024 * 1024;
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

/** Returns a plain-language problem with an uploaded file, or null when it is fine. */
export function validateMediaFile(file: { type: string; size: number }, kind: MediaKind): string | null {
  const base = baseMimeType(file.type);
  if (!base.startsWith(`${kind}/`)) {
    return kind === "video" ? "That file is not a video. Choose an MP4, MOV or WebM file." : "That file is not audio. Choose an MP3, M4A or WAV file.";
  }
  if (file.size > MAX_MEDIA_BYTES) {
    return "That file is larger than 100 MB. Trim it or record a shorter one.";
  }
  if (file.size === 0) {
    return "That file is empty. Choose another one.";
  }
  return null;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Shrinks a photo to a square JPEG before upload. Phone photos are several
 * megabytes; an avatar needs a few kilobytes.
 */
export async function resizeImageToSquare(file: Blob, size = 320, quality = 0.86): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process that image.");
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close?.();
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not process that image."))), "image/jpeg", quality);
  });
}
