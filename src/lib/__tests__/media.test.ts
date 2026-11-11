import { describe, expect, it } from "vitest";
import {
  MAX_MEDIA_BYTES,
  baseMimeType,
  contentTypeFor,
  extensionForMime,
  formatDuration,
  pickRecorderMimeType,
  validateMediaFile,
} from "../media";

describe("pickRecorderMimeType", () => {
  it("prefers MP4, which plays on every phone", () => {
    expect(pickRecorderMimeType("video", () => true)).toContain("video/mp4");
    expect(pickRecorderMimeType("audio", () => true)).toContain("audio/mp4");
  });

  it("falls back to WebM where MP4 recording is missing", () => {
    expect(pickRecorderMimeType("video", (type) => type.startsWith("video/webm"))).toContain("video/webm");
  });

  it("lets the browser choose when nothing is supported or the check throws", () => {
    expect(pickRecorderMimeType("video", () => false)).toBeUndefined();
    expect(
      pickRecorderMimeType("audio", () => {
        throw new Error("not available");
      }),
    ).toBeUndefined();
  });
});

describe("mime helpers", () => {
  it("drops codec details", () => {
    expect(baseMimeType("video/webm;codecs=vp9,opus")).toBe("video/webm");
    expect(baseMimeType(null)).toBe("");
  });

  it("matches the file extension to the real container", () => {
    expect(extensionForMime("video/webm;codecs=vp9", "video")).toBe("webm");
    expect(extensionForMime("video/quicktime", "video")).toBe("mov");
    expect(extensionForMime("audio/mp4", "audio")).toBe("m4a");
    expect(extensionForMime("", "video")).toBe("mp4");
    expect(extensionForMime("something/odd", "audio")).toBe("m4a");
  });

  it("stores a content type that fits the kind of recording", () => {
    expect(contentTypeFor("video/webm;codecs=vp8", "video")).toBe("video/webm");
    expect(contentTypeFor("video/mp4", "audio")).toBe("audio/mp4");
    expect(contentTypeFor("", "audio")).toBe("audio/mp4");
    expect(contentTypeFor(undefined, "video")).toBe("video/mp4");
  });
});

describe("validateMediaFile", () => {
  it("accepts a normal video", () => {
    expect(validateMediaFile({ type: "video/mp4", size: 5_000_000 }, "video")).toBeNull();
  });

  it("explains each problem in plain words", () => {
    expect(validateMediaFile({ type: "image/png", size: 100 }, "video")).toContain("not a video");
    expect(validateMediaFile({ type: "video/mp4", size: 100 }, "audio")).toContain("not audio");
    expect(validateMediaFile({ type: "video/mp4", size: MAX_MEDIA_BYTES + 1 }, "video")).toContain("100 MB");
    expect(validateMediaFile({ type: "audio/mpeg", size: 0 }, "audio")).toContain("empty");
  });
});

describe("formatDuration", () => {
  it("shows minutes and seconds", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65.9)).toBe("1:05");
    expect(formatDuration(-4)).toBe("0:00");
  });
});
