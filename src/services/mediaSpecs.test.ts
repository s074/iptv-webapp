import { describe, expect, it } from "vitest"
import {
  formatBitrate,
  formatChannels,
  formatDurationSecs,
  formatFrameRate,
  formatLanguage,
  formatResolution,
  formatSampleRate,
  summarizeQuality,
  toNumber,
  toText,
} from "./mediaSpecs"

describe("mediaSpecs coercion", () => {
  it("toNumber accepts numeric strings, rejects junk", () => {
    expect(toNumber("100")).toBe(100)
    expect(toNumber("8")).toBe(8)
    expect(toNumber("")).toBeUndefined()
    expect(toNumber("abc")).toBeUndefined()
    expect(toNumber(undefined)).toBeUndefined()
    expect(toNumber(NaN)).toBeUndefined()
  })

  it("toText trims and drops empties", () => {
    expect(toText("  x  ")).toBe("x")
    expect(toText("   ")).toBeUndefined()
    expect(toText(42)).toBeUndefined()
  })
})

describe("mediaSpecs formatters", () => {
  it("formats 1080p and 4K, rejects bad dimensions", () => {
    expect(formatResolution(1920, 1080)).toBe("1920 × 1080 (1080p)")
    expect(formatResolution("1920", "1080")).toBe("1920 × 1080 (1080p)")
    expect(formatResolution(3840, 2160)).toBe("3840 × 2160 (4K)")
    expect(formatResolution(0, 1080)).toBeUndefined()
    expect(formatResolution(undefined, undefined)).toBeUndefined()
  })

  it("formats frame rates, rejects 0/0", () => {
    expect(formatFrameRate("25/1")).toBe("25 fps")
    expect(formatFrameRate("30000/1001")).toBe("29.97 fps")
    expect(formatFrameRate("0/0")).toBeUndefined()
    expect(formatFrameRate(25)).toBe("25 fps")
    expect(formatFrameRate(undefined)).toBeUndefined()
  })

  it("formats bitrates without mislabeling units", () => {
    expect(formatBitrate("8985378")).toBe("9.0 Mbps")
    expect(formatBitrate("640000")).toBe("640 Kbps")
    expect(formatBitrate(0)).toBeUndefined()
    expect(formatBitrate("")).toBeUndefined()
  })

  it("formats channels, preferring layout", () => {
    expect(formatChannels(6, "5.1(side)")).toBe("5.1")
    expect(formatChannels(2, undefined)).toBe("Stereo")
    expect(formatChannels(1, undefined)).toBe("Mono")
    expect(formatChannels("6", undefined)).toBe("6 channels")
    expect(formatChannels(undefined, undefined)).toBeUndefined()
  })

  it("formats sample rates and durations", () => {
    expect(formatSampleRate("48000")).toBe("48 kHz")
    expect(formatSampleRate(44100)).toBe("44.1 kHz")
    expect(formatDurationSecs(2921)).toBe("00:48:41")
    expect(formatDurationSecs("2921")).toBe("00:48:41")
    expect(formatDurationSecs(-1)).toBeUndefined()
  })

  it("maps common language codes, passes the rest through", () => {
    expect(formatLanguage("ukr")).toBe("Ukrainian")
    expect(formatLanguage("eng")).toBe("English")
    expect(formatLanguage("xx")).toBe("XX")
    expect(formatLanguage("")).toBeUndefined()
  })
})

describe("summarizeQuality", () => {
  it("collapses a full ffprobe blob", () => {
    const { summary, hasSpecs } = summarizeQuality({
      container: "mkv",
      video: {
        codec_name: "h264",
        width: 1920,
        height: 1080,
        avg_frame_rate: "25/1",
        tags: { language: "eng", BPS: 8985378 } as never,
      },
      audio: {
        codec_name: "eac3",
        channels: 6,
        channel_layout: "5.1(side)",
        sample_rate: "48000",
        tags: { language: "ukr" },
      } as never,
      durationSecs: 2921,
    })
    expect(hasSpecs).toBe(true)
    expect(summary).toMatchObject({
      container: "MKV",
      resolution: "1920 × 1080 (1080p)",
      videoCodec: "H264",
      frameRate: "25 fps",
      videoBitrate: "9.0 Mbps",
      audioCodec: "EAC3",
      audioChannels: "5.1",
      audioRate: "48 kHz",
      audioLanguage: "Ukrainian",
      duration: "00:48:41",
    })
  })

  it("reports no specs when the provider sent nothing usable", () => {
    expect(summarizeQuality({}).hasSpecs).toBe(false)
    expect(
      summarizeQuality({ video: { width: 0, height: 0 } }).hasSpecs,
    ).toBe(false)
  })
})
