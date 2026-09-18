import {
  LiveStreamEPGItem,
} from "./XtremeCodesAPI.types"
import { Xmltv, parseXmltv } from "@iptv/xmltv"
import { localStorageGet, localStorageSet } from "./utils"
import { STORAGE_KEY } from "./constants"
import {
  XmltvProgrammeStream,
  epgItemFromParts,
  parseXmltvTime,
} from "./xmltvStream"

// Only the guide URL list is persisted (IndexedDB, like the rest of the
// app's storage). The fetched XML payloads are deliberately short-lived:
// held in memory only, refetched on the first LiveTV visit. New tab on a
// fresh profile = re-enter URLs; refresh = refetch silently.
export async function getExternalEpgUrls(): Promise<string[]> {
  try {
    const raw = await localStorageGet(STORAGE_KEY.EXT_EPG_URLS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((url): url is string => typeof url === "string")
  } catch {
    return []
  }
}

async function setExternalEpgUrls(urls: string[]): Promise<void> {
  try {
    await localStorageSet(STORAGE_KEY.EXT_EPG_URLS, JSON.stringify(urls))
  } catch {
    // ignore (private mode)
  }
}

export async function addExternalEpgUrl(url: string): Promise<string[]> {
  const clean = url.trim()
  const urls = await getExternalEpgUrls()
  if (clean && !urls.includes(clean)) {
    urls.push(clean)
    await setExternalEpgUrls(urls)
  }
  return urls
}

export async function removeExternalEpgUrl(url: string): Promise<string[]> {
  const urls = (await getExternalEpgUrls()).filter((entry) => entry !== url)
  await setExternalEpgUrls(urls)
  return urls
}

function textOf(
  field: { _value?: string } | string | undefined,
): string | undefined {
  if (!field) return undefined
  if (typeof field === "string") return field
  return field._value
}

/**
 * Maps a parsed XMLTV document to per-channel listing arrays keyed by the
 * programme channel id (matches stream.epg_channel_id / playlist tvg-id,
 * e.g. "KETV.us"). Titles here are plain text, never base64 — items are
 * flagged so the Xtream title decoder leaves them alone.
 */
export function xmltvToListings(xmltv: Xmltv): Map<string, LiveStreamEPGItem[]> {
  const byChannel = new Map<string, LiveStreamEPGItem[]>()
  for (const programme of xmltv.programmes ?? []) {
    if (!programme.channel || !(programme.start instanceof Date)) continue
    const stop =
      programme.stop instanceof Date ? programme.stop : programme.start
    const startEpoch = Math.floor(programme.start.getTime() / 1000)
    const stopEpoch = Math.floor(stop.getTime() / 1000)
    if (!Number.isFinite(startEpoch) || !Number.isFinite(stopEpoch)) continue
    const title = textOf(programme.title[0])
    const desc = textOf(programme.desc?.[0])
    const item = epgItemFromParts(
      programme.channel,
      title,
      desc,
      startEpoch,
      stopEpoch,
    )
    const list = byChannel.get(programme.channel)
    if (list) list.push(item)
    else byChannel.set(programme.channel, [item])
  }
  for (const list of byChannel.values()) {
    list.sort(
      (a, b) => (Number(a.start_timestamp) || 0) - (Number(b.start_timestamp) || 0),
    )
  }
  return byChannel
}

export interface GuideProgress {
  url: string
  receivedBytes: number
  totalBytes: number | null
  done: boolean
}

const progressListeners = new Set<(progress: GuideProgress) => void>()

export function subscribeGuideProgress(
  fn: (progress: GuideProgress) => void,
): () => void {
  progressListeners.add(fn)
  return () => {
    progressListeners.delete(fn)
  }
}

function emitProgress(progress: GuideProgress): void {
  for (const fn of progressListeners) {
    try {
      fn(progress)
    } catch {
      // a broken listener must never stall a download
    }
  }
}

const MAX_PROGRAMMES = 1000000

function insertProgramme(
  byChannel: Map<string, LiveStreamEPGItem[]>,
  channel: string,
  title: string | undefined,
  desc: string | undefined,
  start: string,
  stop: string | undefined,
): boolean {
  const startEpoch = parseXmltvTime(start)
  if (startEpoch === undefined) return false
  const stopEpoch = parseXmltvTime(stop) ?? startEpoch
  const item = epgItemFromParts(channel, title, desc, startEpoch, stopEpoch)
  const list = byChannel.get(channel)
  if (list) list.push(item)
  else byChannel.set(channel, [item])
  return true
}

// Streams the response body through gunzip (when needed) and the
// incremental parser, so peak memory stays near one network chunk plus the
// final listings — never the whole file as text plus a DOM tree.
async function fetchStreamed(
  response: Response,
  url: string,
  wantsGunzip: boolean,
): Promise<Map<string, LiveStreamEPGItem[]>> {
  const totalHeader = response.headers.get("content-length")
  const totalParsed = totalHeader === null ? NaN : Number(totalHeader)
  const totalBytes = Number.isFinite(totalParsed) ? totalParsed : null

  const reader = response.body!.getReader()
  const first = await reader.read()
  if (first.done || !first.value) {
    reader.releaseLock()
    throw new Error("Empty guide response")
  }
  const head = first.value
  // Magic sniff covers mislabeled URLs even mid-stream. (Servers that send
  // Content-Encoding: gzip are already decoded by fetch itself.)
  const magicGzip = head.length >= 2 && head[0] === 0x1f && head[1] === 0x8b
  const gunzip = wantsGunzip || magicGzip
  if (gunzip && typeof DecompressionStream === "undefined") {
    reader.releaseLock()
    throw new Error("This browser cannot decompress .gz guides")
  }

  let receivedBytes = head.length
  emitProgress({ url, receivedBytes, totalBytes, done: false })

  // Re-feed the peeked chunk, then pump the rest while counting raw bytes.
  const rest = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(head)
      const pump = (): void => {
        reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              controller.close()
              return
            }
            receivedBytes += value.length
            emitProgress({ url, receivedBytes, totalBytes, done: false })
            controller.enqueue(value)
            pump()
          })
          .catch((err) => controller.error(err))
      }
      pump()
    },
    cancel() {
      reader.cancel().catch(() => {})
    },
  })

  // TextDecoderStream's lib types are looser than pipeThrough wants —
  // the cast only narrows BufferSource down to what we actually feed it.
  const textDecoder = () =>
    new TextDecoderStream() as unknown as TransformStream<Uint8Array, string>
  const textStream: ReadableStream<string> = gunzip
    ? rest
        .pipeThrough<Uint8Array>(
          new DecompressionStream("gzip") as TransformStream<
            Uint8Array,
            Uint8Array
          >,
        )
        .pipeThrough(textDecoder())
    : rest.pipeThrough(textDecoder())

  const parser = new XmltvProgrammeStream()
  const byChannel = new Map<string, LiveStreamEPGItem[]>()
  let programmeCount = 0
  const textReader = textStream.getReader()
  while (true) {
    const { done, value } = await textReader.read()
    if (value) {
      for (const programme of parser.push(value)) {
        if (
          insertProgramme(
            byChannel,
            programme.channel,
            programme.title,
            programme.desc,
            programme.start,
            programme.stop,
          )
        ) {
          programmeCount += 1
          if (programmeCount > MAX_PROGRAMMES) {
            textReader.releaseLock()
            throw new Error("Guide exceeds supported size")
          }
        }
      }
    }
    if (done) break
  }
  parser.finish()

  emitProgress({ url, receivedBytes, totalBytes, done: true })
  if (programmeCount === 0) {
    throw new Error("No programmes found in that guide")
  }
  for (const list of byChannel.values()) {
    list.sort(
      (a, b) => (Number(a.start_timestamp) || 0) - (Number(b.start_timestamp) || 0),
    )
  }
  return byChannel
}

export async function fetchExternalEpg(
  url: string,
): Promise<Map<string, LiveStreamEPGItem[]>> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Guide download failed (HTTP ${response.status})`)
  }
  const contentEncoding = response.headers.get("content-encoding") || ""
  const serverDecoded = contentEncoding.toLowerCase().includes("gzip")
  const wantsGunzip =
    !serverDecoded && url.trim().toLowerCase().endsWith(".gz")
  if (
    response.body &&
    typeof TextDecoderStream !== "undefined" &&
    (!wantsGunzip || typeof DecompressionStream !== "undefined")
  ) {
    return fetchStreamed(response, url, wantsGunzip)
  }
  // Ancient runtimes without stream transforms: buffered fallback.
  const text = await decodeGuidePayload(await response.arrayBuffer(), url)
  let xmltv: Xmltv
  try {
    xmltv = parseXmltv(text)
  } catch (e) {
    throw new Error("Could not parse that file as XMLTV")
  }
  const listings = xmltvToListings(xmltv)
  if (listings.size === 0) {
    throw new Error("No programmes found in that guide")
  }
  return listings
}

// Guides arrive as plain XML or gzip (.xml.gz). Sniff the magic bytes so
// mislabeled URLs work too — servers that send Content-Encoding: gzip are
// already decompressed by fetch itself, landing here as plain XML.
export async function decodeGuidePayload(
  buffer: ArrayBuffer,
  url: string,
): Promise<string> {
  const bytes = new Uint8Array(buffer)
  const isGzip =
    url.trim().toLowerCase().endsWith(".gz") ||
    (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b)
  if (!isGzip) {
    return new TextDecoder().decode(buffer)
  }
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser cannot decompress .gz guides")
  }
  const stream = new Blob([buffer]).stream().pipeThrough(
    new DecompressionStream("gzip"),
  )
  return new Response(stream).text()
}
