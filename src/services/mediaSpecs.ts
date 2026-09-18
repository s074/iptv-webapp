import {
  AudioInformation,
  VideoInformation,
} from "./XtremeCodesAPI.types"

// Provider ffprobe blobs vary wildly: objects missing entirely, numbers
// sent as strings ("100", "8"), "0/0" frame rates, empty strings. Every
// formatter below returns undefined for anything unusable so callers can
// simply skip the row — never render "undefined" or "NaN fps".

export function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined
  }
  if (typeof value === "string" && value.trim() !== "") {
    const num = Number(value)
    return Number.isFinite(num) ? num : undefined
  }
  return undefined
}

export function toText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

// 1920x1080 -> "1920 × 1080 (1080p)"; 3840x2160 -> "… (4K)".
export function formatResolution(
  width: unknown,
  height: unknown,
): string | undefined {
  const w = toNumber(width)
  const h = toNumber(height)
  if (w === undefined || h === undefined || w <= 0 || h <= 0) return undefined
  const label = h >= 2000 ? "4K" : `${h}p`
  return `${w} × ${h} (${label})`
}

// "25/1" -> "25 fps"; "30000/1001" -> "29.97 fps"; "0/0" -> undefined.
export function formatFrameRate(value: unknown): string | undefined {
  if (typeof value === "number") {
    return value > 0 ? `${value} fps` : undefined
  }
  if (typeof value !== "string") return undefined
  const parts = value.split("/")
  const num = toNumber(parts[0])
  const den = parts.length > 1 ? toNumber(parts[1]) : 1
  if (num === undefined || num <= 0) return undefined
  if (den === undefined || den === 0) return `${num} fps`
  const fps = num / den
  if (!Number.isFinite(fps) || fps <= 0) return undefined
  const rounded = Math.round(fps * 100) / 100
  return `${rounded} fps`
}

// ffmpeg BPS tags are bits/sec: 8985378 -> "9.0 Mbps"; 640000 -> "640 Kbps".
export function formatBitrate(bps: unknown): string | undefined {
  const num = toNumber(bps)
  if (num === undefined || num <= 0) return undefined
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)} Mbps`
  if (num >= 1000) return `${Math.round(num / 1000)} Kbps`
  return `${Math.round(num)} bps`
}

// 6 + "5.1(side)" -> "5.1"; 2 -> "Stereo"; 1 -> "Mono".
export function formatChannels(
  channels: unknown,
  layout?: unknown,
): string | undefined {
  const cleanLayout = toText(layout)?.replace(/\(.*\)/, "").trim()
  if (cleanLayout) return cleanLayout
  const count = toNumber(channels)
  if (count === undefined) return undefined
  if (count === 1) return "Mono"
  if (count === 2) return "Stereo"
  return `${count} channels`
}

// "48000" -> "48 kHz".
export function formatSampleRate(value: unknown): string | undefined {
  const num = toNumber(value)
  if (num === undefined || num <= 0) return undefined
  if (num >= 1000) {
    const khz = num / 1000
    return `${Number.isInteger(khz) ? khz : khz.toFixed(1)} kHz`
  }
  return `${num} Hz`
}

// 2921 (or "2921") -> "00:48:41".
export function formatDurationSecs(value: unknown): string | undefined {
  const total = toNumber(value)
  if (total === undefined || total < 0) return undefined
  const secs = Math.floor(total)
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

const LANGUAGE_NAMES: Record<string, string> = {
  eng: "English",
  ukr: "Ukrainian",
  rus: "Russian",
  spa: "Spanish",
  fre: "French",
  fra: "French",
  ger: "German",
  deu: "German",
  ita: "Italian",
  por: "Portuguese",
  ara: "Arabic",
  hin: "Hindi",
  tel: "Telugu",
  tam: "Tamil",
  kor: "Korean",
  jpn: "Japanese",
  chi: "Chinese",
  zho: "Chinese",
  dut: "Dutch",
  nld: "Dutch",
  pol: "Polish",
  tur: "Turkish",
  vie: "Vietnamese",
  tha: "Thai",
}

export function formatLanguage(code: unknown): string | undefined {
  const clean = toText(code)?.toLowerCase()
  if (!clean) return undefined
  return LANGUAGE_NAMES[clean] ?? clean.toUpperCase()
}

export interface QualitySummary {
  container?: string
  resolution?: string
  videoCodec?: string
  frameRate?: string
  videoBitrate?: string
  audioCodec?: string
  audioChannels?: string
  audioRate?: string
  audioLanguage?: string
  duration?: string
}

// Collapses raw ffprobe blobs into display strings, skipping everything
// absent. hasSpecs is false when the provider sent nothing usable —
// callers render no section at all in that case.
export function summarizeQuality(args: {
  container?: unknown
  video?: VideoInformation
  audio?: AudioInformation
  durationSecs?: unknown
  duration?: unknown
  videoBitrateBps?: unknown
}): { summary: QualitySummary; hasSpecs: boolean } {
  const { container, video, audio, durationSecs, duration, videoBitrateBps } = args
  const summary: QualitySummary = {
    container: toText(container)?.toUpperCase(),
    resolution: formatResolution(video?.width, video?.height),
    videoCodec: toText(video?.codec_name)?.toUpperCase(),
    frameRate: formatFrameRate(video?.avg_frame_rate ?? video?.r_frame_rate),
    videoBitrate: formatBitrate(
      video?.tags?.BPS ?? videoBitrateBps,
    ),
    audioCodec: toText(audio?.codec_name)?.toUpperCase(),
    audioChannels: formatChannels(audio?.channels, audio?.channel_layout),
    audioRate: formatSampleRate(audio?.sample_rate),
    audioLanguage: formatLanguage(audio?.tags?.language),
    duration:
      formatDurationSecs(durationSecs) ?? toText(duration),
  }
  const hasSpecs = Object.values(summary).some(
    (value) => value !== undefined,
  )
  return { summary, hasSpecs }
}
