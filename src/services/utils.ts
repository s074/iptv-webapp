import { get, set, clear } from "idb-keyval"
import { LiveStream, SeriesStream, VodStream } from "./XtremeCodesAPI.types"

export const localStorageSet = (key: string, data: string): Promise<void> => {
  return set(key, data)
}

export const localStorageGet = (
  key: string,
): Promise<string | null | undefined> => {
  return get(key)
}

export const deleteAccountFromLocalStorage = (): Promise<void> => {
  return clear()
}

export const getDateForTimestamp = (seconds: number): Date => {
  return new Date(seconds * 1000)
}

export const isVod = (
  stream: VodStream | SeriesStream | LiveStream,
): stream is VodStream => {
  const vodStream = stream as VodStream
  return vodStream.stream_id !== undefined && vodStream.stream_type !== "live"
}

export const isSeries = (
  stream: VodStream | SeriesStream | LiveStream,
): stream is SeriesStream => {
  return (stream as SeriesStream).series_id !== undefined
}

export const isLive = (
  stream: VodStream | SeriesStream | LiveStream,
): stream is LiveStream => {
  const liveStream = stream as LiveStream
  return liveStream.stream_type === "live" && liveStream.stream_id !== undefined
}

export const containerToMimeType = (container: string): string => {
  switch (container) {
    case "mkv":
      return "video/webm"
    case "mp4":
    case "mov":
    case "m4v":
      return "video/mp4"
    case "avi":
      return "video/x-msvideo"
    case "3gp":
      return "video/3gpp"
    case "mpg":
    case "mpeg":
      return "video/mpeg"
    case "ogg":
    case "ogv":
    case "opus":
      return "video/ogg"
    case "mpd":
      return "application/dash+xml"
    case "m3u8":
      return "application/x-mpegURL"
    default:
      return `video/${container}`
  }
}

export const copyTextToClibpboard = async (text: string) => {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
  } // todo: fix bc this shit wont work on http site
  else {
    unsecuredCopyToClipboard(text)
  }
  console.log(text)
}

function unsecuredCopyToClipboard(text: string) {
  const textArea = document.createElement("textarea")
  textArea.value = text
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  try {
    document.execCommand("copy")
  } catch (err) {
    console.error("Unable to copy to clipboard", err)
  }
  document.body.removeChild(textArea)
}

export const b64DecodeUnicode = (str: string) => {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(atob(str).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}
