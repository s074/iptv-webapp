import {
  Category,
  LiveStream,
} from "./XtremeCodesAPI.types"

export interface M3UEntry {
  name: string
  tvgId?: string
  tvgName?: string
  logo?: string
  /** All categories this entry belongs to (group-title split on ";"). */
  groups: string[]
  /** Primary group (first tag) — kept for convenience. */
  group?: string
  url: string
}

const MAX_ENTRIES = 50000
const UNCATEGORIZED = "Uncategorized"

// Markers of an HLS *stream* playlist (master or media). Channel lists
// never contain these — but media segments reuse the #EXTINF tag, so
// without this guard a pasted stream URL parses into garbage
// segment-"channels".
const HLS_STREAM_MARKERS = [
  "#EXT-X-STREAM-INF",
  "#EXT-X-TARGETDURATION",
  "#EXT-X-MEDIA-SEQUENCE",
  "#EXT-X-ENDLIST",
  "#EXT-X-KEY",
  "#EXT-X-MAP",
  "#EXT-X-PLAYLIST-TYPE",
  "#EXT-X-DISCONTINUITY-SEQUENCE",
  "#EXT-X-START",
]

// djb2 — stable across sessions so favorites and ?channel= links survive
// playlist reorders. Unsigned 32-bit, fits the numeric stream_id field.
export function hashStreamId(url: string): number {
  let hash = 5381
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) + hash + url.charCodeAt(i)) | 0
  }
  return hash >>> 0
}

function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  // Quoted values may contain commas — never split naively on ",".
  const regex = /([A-Za-z0-9_-]+)="([^"]*)"/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(attrString)) !== null) {
    attrs[match[1].toLowerCase()] = match[2]
  }
  return attrs
}

// Splits "#EXTINF:-1 <attrs>,Display Name" on the first comma OUTSIDE
// quotes — attribute values like tvg-name="Comma, In Name" contain commas.
function splitExtinf(line: string): { attrs: string; display: string } {
  const rest = line.startsWith("#EXTINF:")
    ? line.slice("#EXTINF:".length)
    : line
  let inQuotes = false
  for (let i = 0; i < rest.length; i++) {
    const ch = rest[i]
    if (ch === '"') inQuotes = !inQuotes
    else if (ch === "," && !inQuotes) {
      return { attrs: rest.slice(0, i), display: rest.slice(i + 1).trim() }
    }
  }
  return { attrs: rest, display: "" }
}

function resolveUrl(raw: string, baseUrl?: string): string | undefined {
  const trimmed = raw.trim()
  if (trimmed.length === 0) return undefined
  try {
    const resolved = baseUrl
      ? new URL(trimmed, baseUrl).href
      : new URL(trimmed).href
    return /^https?:\/\//i.test(resolved) ? resolved : undefined
  } catch {
    return undefined
  }
}

/**
 * Minimal M3U parser. Returns entries with absolute http(s) URLs.
 * Throws on non-playlist input, empty results, or absurd size.
 */
export function parseM3U(text: string, baseUrl?: string): M3UEntry[] {
  const lines = text.split(/\r?\n/)
  const first = lines.find((line) => line.trim().length > 0)
  if (!first || !first.trim().startsWith("#EXTM3U")) {
    throw new Error("Not an M3U playlist (missing #EXTM3U header)")
  }
  if (
    lines.some((line) =>
      HLS_STREAM_MARKERS.some((marker) => line.trim().startsWith(marker)),
    )
  ) {
    throw new Error(
      "This looks like a media stream playlist (HLS), not a channel list. Use a channel list (.m3u) with #EXTINF entries instead.",
    )
  }

  const entries: M3UEntry[] = []
  const seen = new Set<string>()

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line.startsWith("#EXTINF")) continue

    // #EXTINF:-1 <attrs>,Display Name
    const { attrs: attrString, display: displayName } = splitExtinf(line)
    const attrs = parseAttributes(attrString)

    // URL is the next non-empty, non-comment line.
    let url: string | undefined
    for (let j = i + 1; j < lines.length; j++) {
      const candidate = lines[j].trim()
      if (candidate.length === 0 || candidate.startsWith("#")) continue
      url = resolveUrl(candidate, baseUrl)
      i = j
      break
    }
    if (!url || seen.has(url)) continue
    seen.add(url)

    const tvgName = attrs["tvg-name"] || undefined
    // group-title lists EVERY category the entry belongs to, separated
    // by ";" (e.g. "News;Sports" is in both News and Sports).
    const groups = (attrs["group-title"] || "")
      .split(";")
      .map((group) => group.trim())
      .filter((group) => group.length > 0)
    entries.push({
      name: displayName || tvgName || url,
      tvgId: attrs["tvg-id"] || undefined,
      tvgName,
      logo: attrs["tvg-logo"] || undefined,
      groups,
      group: groups[0],
      url,
    })

    if (entries.length > MAX_ENTRIES) {
      throw new Error(`Playlist exceeds ${MAX_ENTRIES} entries`)
    }
  }

  if (entries.length === 0) {
    throw new Error("No playable entries found in playlist")
  }

  return entries
}

/**
 * Maps entries to the store's channel shape. Every entry becomes a channel
 * (there is no VOD signal in M3U). Category ids are namespaced strings so
 * they can never collide with Xtream numeric ids. An entry lands in EVERY
 * group it lists via `category_ids`; `category_id` stays the primary
 * (first) group for single-category consumers.
 */
export function m3uToLiveChannels(entries: M3UEntry[]): {
  categories: Category[]
  streams: LiveStream[]
} {
  const groupOrder: string[] = []
  const groupSeen = new Set<string>()
  for (const entry of entries) {
    const groups = entry.groups.length > 0 ? entry.groups : [UNCATEGORIZED]
    for (const group of groups) {
      if (!groupSeen.has(group)) {
        groupSeen.add(group)
        groupOrder.push(group)
      }
    }
  }

  const categories: Category[] = groupOrder.map((group, index) => ({
    category_id: `m3u:${index}`,
    category_name: group,
  }))
  const groupToId = new Map(groupOrder.map((group, index) => [group, `m3u:${index}`]))

  const streams: LiveStream[] = entries.map((entry) => {
    const groups = entry.groups.length > 0 ? entry.groups : [UNCATEGORIZED]
    const ids = groups.map((group) => groupToId.get(group))
    return {
      stream_id: hashStreamId(entry.url),
      name: entry.name,
      stream_icon: entry.logo,
      category_id: ids[0],
      category_ids: ids.filter((id): id is string => id !== undefined),
      stream_type: "live",
      epg_channel_id: entry.tvgId,
      tv_archive: 0,
      direct_source: entry.url,
    }
  })

  return { categories, streams }
}
