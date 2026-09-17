export interface WatchlistItem {
  type: "vod" | "series"
  id: number
}

// Active content source. Xtream credentials live in apiConfig; an M3U
// source carries its own pointer (URL or file label) plus fetch time.
// Parsed M3U channels/categories live under their own storage keys.
export type MediaSource =
  | { kind: "xtream" }
  | {
      kind: "m3u"
      origin: "url" | "file"
      url?: string
      fileName?: string
      fetchedAt: number
    }
