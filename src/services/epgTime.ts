import { useSyncExternalStore } from "react"

// Correction (in minutes) applied to provider EPG epochs before display.
// Some Xtream panels stamp listings with a fixed offset (e.g. +2h) versus
// the real broadcast. 0 = trust the feed (UTC, per the Xtream convention).
const STORAGE_KEY = "my-tv-app-epg-offset-minutes"

function readStored(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return 0
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? Math.round(parsed) : 0
  } catch {
    return 0
  }
}

let offsetMinutes =
  typeof localStorage !== "undefined" ? readStored() : 0

const listeners = new Set<() => void>()

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

function getSnapshot(): number {
  return offsetMinutes
}

export function getEpgOffsetMinutes(): number {
  return offsetMinutes
}

export function setEpgOffsetMinutes(value: number): void {
  const next = Number.isFinite(value) ? Math.round(value) : 0
  if (next === offsetMinutes) return
  offsetMinutes = next
  try {
    localStorage.setItem(STORAGE_KEY, String(next))
  } catch {
    // ignore (private mode)
  }
  listeners.forEach((fn) => fn())
}

export function useEpgOffsetMinutes(): number {
  return useSyncExternalStore(subscribe, getSnapshot)
}

// "-120" -> "−2:00", 0 -> "Auto"
export function formatOffsetLabel(minutes: number): string {
  if (minutes === 0) return "Auto"
  const sign = minutes > 0 ? "+" : "−"
  const abs = Math.abs(minutes)
  const hours = Math.floor(abs / 60)
  const mins = abs % 60
  return `${sign}${hours}:${mins.toString().padStart(2, "0")}`
}

// UTC offset of an IANA zone at a given instant, in minutes east of UTC
// (e.g. Europe/Amsterdam in September -> +120). undefined when the zone
// string is invalid. DST-aware , callers should note the value can differ
// across dates near a transition.
export function getTimeZoneOffsetMinutes(
  timeZone: string,
  at: Date = new Date(),
): number | undefined {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(at)
      .reduce<Record<string, string>>((acc, part) => {
        acc[part.type] = part.value
        return acc
      }, {})
    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour) % 24,
      Number(parts.minute),
      Number(parts.second),
    )
    if (!Number.isFinite(asUtc)) return undefined
    return Math.round((asUtc - at.getTime()) / 60000)
  } catch {
    return undefined
  }
}
