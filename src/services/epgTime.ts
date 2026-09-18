import { useSyncExternalStore } from "react"
import { localStorageGet, localStorageSet } from "./utils"
import { STORAGE_KEY } from "./constants"

// EPG time corrections, keyed by guide source. A correction belongs to
// whoever stamped the feed, so Xtream bulk and each external guide URL get
// their own entry. Persisted in IndexedDB next to the guide URL list;
// fetched guide payloads stay memory-only.
export const XTREAM_BULK_SOURCE_ID = "xtream:bulk"
export const extEpgSourceId = (url: string): string => `ext:${url}`

let offsets: Record<string, number> = {}
const listeners = new Set<() => void>()

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

function notify(): void {
  listeners.forEach((fn) => fn())
}

function persist(): void {
  localStorageSet(STORAGE_KEY.EXT_EPG_OFFSETS, JSON.stringify(offsets)).catch(
    () => {},
  )
}

function sanitize(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  const clean: Record<string, number> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const num = Number(value)
    if (typeof key === "string" && Number.isFinite(num) && num !== 0) {
      clean[key] = Math.round(num)
    }
  }
  return clean
}

export function getEpgOffsets(): Record<string, number> {
  return offsets
}

export function getEpgOffset(sourceId?: string): number {
  if (!sourceId) return 0
  return offsets[sourceId] ?? 0
}

export function setEpgOffset(sourceId: string, minutes: number): void {
  const next = Number.isFinite(minutes) ? Math.round(minutes) : 0
  const updated = { ...offsets }
  if (next === 0) delete updated[sourceId]
  else updated[sourceId] = next
  if (JSON.stringify(updated) === JSON.stringify(offsets)) return
  offsets = updated
  persist()
  notify()
}

export function useEpgOffsets(): Record<string, number> {
  return useSyncExternalStore(subscribe, () => offsets)
}

// Loads persisted corrections into memory. Call once per session before
// anything renders guide times (loadApp, login).
export async function hydrateEpgOffsets(): Promise<void> {
  try {
    const raw = await localStorageGet(STORAGE_KEY.EXT_EPG_OFFSETS)
    offsets = raw ? sanitize(JSON.parse(raw)) : {}
  } catch {
    offsets = {}
  }
  notify()
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
// string is invalid. DST-aware, callers should note the value can differ
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
