import {
  LiveStreamEPGItem,
} from "./XtremeCodesAPI.types"

// Minimal streaming XMLTV parser. It understands exactly what the guide
// needs — <programme> elements with channel/start/stop attributes and
// <title>/<desc> children — and nothing else. Feed it arbitrary text
// chunks; it buffers split tags internally and emits completed programmes.
export interface StreamProgramme {
  channel: string
  start: string
  stop?: string
  title?: string
  desc?: string
}

interface ActiveProgramme {
  attrs: string
  title: string
  desc: string
  capturing: "title" | "desc" | null
}

function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const regex = /([A-Za-z0-9_:-]+)="([^"]*)"/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(attrString)) !== null) {
    attrs[match[1].toLowerCase()] = match[2]
  }
  return attrs
}

const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
}

export function decodeXmlEntities(text: string): string {
  return text.replace(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/g, (entity, body: string) => {
    if (body[0] === "#") {
      const code =
        body[1] === "x" || body[1] === "X"
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10)
      if (Number.isFinite(code)) {
        try {
          return String.fromCodePoint(code)
        } catch {
          return entity
        }
      }
      return entity
    }
    return ENTITY_MAP[body] ?? entity
  })
}

function unwrapCdata(text: string): string {
  return text.replace(/<!\[CDATA\[(.*?)\]\]>/gs, (_, inner: string) => inner)
}

/**
 * XMLTV timestamps look like "20260917013000 +0000" (zone optional).
 * Missing zone = UTC, matching the Xtream wall convention used elsewhere.
 * Returns epoch seconds, or undefined when unparseable.
 */
export function parseXmltvTime(value: string | undefined): number | undefined {
  if (!value) return undefined
  const match =
    /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\s*([+-])(\d{2}):?(\d{2}))?/.exec(
      value.trim(),
    )
  if (!match) return undefined
  const [, year, month, day, hour, minute, second, sign, offHour, offMin] = match
  let ms = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  )
  if (!Number.isFinite(ms)) return undefined
  if (sign && offHour !== undefined && offMin !== undefined) {
    const offsetMinutes = Number(offHour) * 60 + Number(offMin)
    ms += (sign === "+" ? -1 : 1) * offsetMinutes * 60000
  }
  return Math.floor(ms / 1000)
}

// Shared item builder: both the full-document and streaming paths funnel
// through here so listings stay identical regardless of parse strategy.
export function epgItemFromParts(
  channel: string,
  title: string | undefined,
  desc: string | undefined,
  startEpoch: number,
  stopEpoch: number,
): LiveStreamEPGItem {
  return {
    id: `${channel}-${startEpoch}`,
    title: title ?? "Unknown Program",
    titleEncoded: false,
    description: desc,
    start_timestamp: startEpoch,
    stop_timestamp: stopEpoch,
    channel_id: channel,
  }
}

export class XmltvProgrammeStream {
  private tail = ""
  private active: ActiveProgramme | null = null

  /**
   * Push a text chunk, returns programmes completed by it. Text before the
   * first <programme> (headers, <channel> defs) is discarded; an
   * unterminated tail is retained for the next push.
   */
  push(chunk: string): StreamProgramme[] {
    const completed: StreamProgramme[] = []
    // Consume any retained tail up front so every early return below only
    // ever sets fresh tail state — never stale.
    let text = this.tail + chunk
    this.tail = ""
    while (true) {
      if (!this.active) {
        const open = text.indexOf("<programme")
        if (open === -1) {
          // Keep a small tail in case the tag itself was split.
          this.tail = text.length > 32 ? text.slice(-32) : text
          return completed
        }
        const close = text.indexOf(">", open)
        if (close === -1) {
          const partial = text.slice(open)
          if (partial.length > 4096) return completed // malformed tag, drop
          this.tail = partial
          return completed
        }
        const tag = text.slice(open, close + 1)
        text = text.slice(close + 1)
        if (tag.endsWith("/>")) continue
        this.active = {
          attrs: tag.slice("<programme".length, -1),
          title: "",
          desc: "",
          capturing: null,
        }
        continue
      }

      const active = this.active
      if (!active.capturing) {
        const titleOpen = text.indexOf("<title")
        const descOpen = text.indexOf("<desc")
        const progClose = text.indexOf("</programme>")
        const next = Math.min(
          titleOpen === -1 ? Infinity : titleOpen,
          descOpen === -1 ? Infinity : descOpen,
          progClose === -1 ? Infinity : progClose,
        )
        if (next === Infinity) {
          this.tail = text.length > 4096 ? text.slice(-4096) : text
          return completed
        }
        if (next === progClose) {
          this.emit(completed)
          text = text.slice(progClose + "</programme>".length)
          continue
        }
        const isTitle = next === titleOpen
        const tagClose = text.indexOf(">", next)
        if (tagClose === -1) {
          const partial = text.slice(next)
          if (partial.length > 4096) {
            // Malformed tag candidate — skip one char and move on.
            text = text.slice(next + 1)
            continue
          }
          this.tail = partial
          return completed
        }
        // Nested markup inside is not supported — capture raw text until
        // the matching close tag regardless.
        active.capturing = isTitle ? "title" : "desc"
        text = text.slice(tagClose + 1)
        continue
      }

      const closeTag = active.capturing === "title" ? "</title>" : "</desc>"
      // Search the field content PLUS new text together: a close tag split
      // across the boundary lives in neither half alone.
      const combined =
        (active.capturing === "title" ? active.title : active.desc) + text
      const closeAt = combined.indexOf(closeTag)
      if (closeAt === -1) {
        // Commit everything except a closeTag-length overlap, which is
        // retained so a split close tag is still found next push.
        const keep = Math.min(combined.length, closeTag.length - 1)
        const committed = combined.slice(0, combined.length - keep)
        if (combined.length > 65536 + keep) {
          // Runaway field (malformed file) — drop it, don't grow memory.
          if (active.capturing === "title") active.title = ""
          else active.desc = ""
          this.tail = ""
        } else {
          if (active.capturing === "title") active.title = committed
          else active.desc = committed
          this.tail = combined.slice(combined.length - keep)
        }
        return completed
      }
      const inner = combined.slice(0, closeAt)
      if (active.capturing === "title") active.title = inner
      else active.desc = inner
      active.capturing = null
      text = combined.slice(closeAt + closeTag.length)
    }
  }

  finish(): StreamProgramme[] {
    // Drop any half-open programme — a truncated download is reported by
    // its missing </tv>, not by partial rows.
    this.active = null
    this.tail = ""
    return []
  }

  private emit(completed: StreamProgramme[]) {
    const active = this.active
    this.active = null
    if (!active) return
    const attrs = parseAttributes(active.attrs)
    if (!attrs["channel"] || !attrs["start"]) return
    completed.push({
      channel: attrs["channel"],
      start: attrs["start"],
      stop: attrs["stop"],
      title: decodeXmlEntities(unwrapCdata(active.title)).trim() || undefined,
      desc: decodeXmlEntities(unwrapCdata(active.desc)).trim() || undefined,
    })
  }
}
