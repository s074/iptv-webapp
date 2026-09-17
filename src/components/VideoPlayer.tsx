import { FC, useEffect, useRef, useState } from "react"
import videojs from "video.js"
import Player from "video.js/dist/types/player"
import Snackbar from "@mui/material/Snackbar"
import "video.js/dist/video-js.css"

export interface VideoPlayerProps {
  options: any
  onReady?: (player: Player) => void
}

// iOS Safari implements neither document.pictureInPictureEnabled nor
// el.requestPictureInPicture() , the only PiP path video.js speaks.
// It only exposes the WebKit-prefixed presentation-mode API on the
// <video> element, so video.js's built-in toggle stays disabled on
// iPhones. This button covers that path (and only that path , where
// the standard API exists, the built-in toggle keeps working).
//
// Note: home-screen web apps run in a restricted web view, not full
// Safari, and Apple may withhold the WebKit PiP API there too. The
// button therefore falls back to native fullscreen (whose system UI
// can offer PiP) and finally to an explanatory message.
interface WebkitPresentationVideo extends HTMLVideoElement {
  webkitSetPresentationMode?: (
    mode: "inline" | "picture-in-picture" | "fullscreen",
  ) => void
  webkitSupportsPresentationMode?: (mode: string) => boolean
  webkitPresentationMode?: string
  webkitDisplayingFullscreen?: boolean
  webkitExitFullscreen?: () => void
  webkitEnterFullscreen?: () => void
}

export interface PiPSupportInfo {
  standalone: boolean
  standard: boolean
  webkitFn: boolean
  webkitSupported: boolean | null
  presentationMode: string | null
  playsinline: boolean | null
}

export function getPiPSupport(player: Player): PiPSupportInfo {
  const doc = document as Document & { pictureInPictureEnabled?: boolean }
  const el = getTechVideoEl(player)
  let webkitSupported: boolean | null = null
  try {
    const result = el?.webkitSupportsPresentationMode?.("picture-in-picture")
    if (typeof result === "boolean") webkitSupported = result
  } catch {
    webkitSupported = null
  }
  const nav = navigator as Navigator & { standalone?: boolean }
  const standalone =
    nav.standalone === true ||
    (typeof window.matchMedia === "function" &&
      window.matchMedia("(display-mode: standalone)").matches)
  return {
    standalone,
    standard: doc.pictureInPictureEnabled === true,
    webkitFn: typeof el?.webkitSetPresentationMode === "function",
    webkitSupported,
    presentationMode: el?.webkitPresentationMode ?? null,
    playsinline: el ? el.hasAttribute("playsinline") : null,
  }
}

function getTechVideoEl(player: Player): WebkitPresentationVideo | null {
  try {
    const tech = (player as unknown as { tech_?: { el_?: unknown } }).tech_
    const el = tech?.el_
    return el instanceof HTMLVideoElement
      ? (el as WebkitPresentationVideo)
      : null
  } catch {
    return null
  }
}

// True when the page must handle PiP itself: the standard API is missing
// (iOS Safari and home-screen web apps). The button is added in both
// cases , where even the WebKit API is missing, a tap explains why and
// offers native fullscreen instead of silently doing nothing.
function shouldAddIosPiPButton(player: Player): boolean {
  if (typeof document !== "undefined") {
    const doc = document as Document & { pictureInPictureEnabled?: boolean }
    // Standard API present (desktop/Android) , the built-in toggle handles it.
    if (doc.pictureInPictureEnabled) return false
  }
  return getTechVideoEl(player) !== null
}

// Returns true when a WebKit PiP attempt was made.
function tryWebkitPiP(el: WebkitPresentationVideo): boolean {
  if (typeof el.webkitSetPresentationMode !== "function") return false
  try {
    if (
      typeof el.webkitSupportsPresentationMode === "function" &&
      !el.webkitSupportsPresentationMode("picture-in-picture")
    ) {
      return false
    }
  } catch {
    return false
  }
  try {
    if (el.webkitPresentationMode === "picture-in-picture") {
      el.webkitSetPresentationMode("inline")
      return true
    }
    if (el.webkitDisplayingFullscreen && el.webkitExitFullscreen) {
      // iOS refuses PiP straight from native fullscreen , step out first.
      el.webkitExitFullscreen()
      window.setTimeout(() => {
        try {
          el.webkitSetPresentationMode?.("picture-in-picture")
        } catch {
          // ignore , likely tapped before metadata loaded
        }
      }, 350)
      return true
    }
    el.webkitSetPresentationMode("picture-in-picture")
    return true
  } catch {
    return false
  }
}

// Returns true when native fullscreen was entered as a PiP fallback.
function tryFullscreenFallback(el: WebkitPresentationVideo): boolean {
  try {
    if (typeof el.webkitEnterFullscreen === "function") {
      el.webkitEnterFullscreen()
      return true
    }
    if (typeof el.requestFullscreen === "function") {
      void el.requestFullscreen().catch(() => {})
      return true
    }
  } catch {
    // ignore , fall through to the explanatory message
  }
  return false
}

let iosPiPRegistered = false

function ensureIosPiPButton(player: Player) {
  if (!iosPiPRegistered) {
    const VjsButton = videojs.getComponent("Button") as any
    class IosPictureInPictureButton extends VjsButton {
      constructor(p: Player, options?: Record<string, unknown>) {
        super(p, options)
        // Reuses the skin's PiP icon (video-js.css targets this class).
        this.addClass("vjs-picture-in-picture-control")
        this.controlText("Picture-in-Picture")
        getTechVideoEl(p)?.addEventListener(
          "webkitpresentationmodechanged",
          () => {
            const current = getTechVideoEl(this.player())?.webkitPresentationMode
            this.controlText(
              current === "picture-in-picture"
                ? "Exit Picture-in-Picture"
                : "Picture-in-Picture",
            )
          },
        )
      }
      handleClick() {
        const el = getTechVideoEl(this.player())
        if (el && tryWebkitPiP(el)) return
        if (el && tryFullscreenFallback(el)) return
        window.dispatchEvent(
          new CustomEvent<PiPSupportInfo>("app:pip-unavailable", {
            detail: getPiPSupport(this.player()),
          }),
        )
      }
    }
    videojs.registerComponent(
      "IosPictureInPictureButton",
      IosPictureInPictureButton as any,
    )
    iosPiPRegistered = true
  }

  if (!shouldAddIosPiPButton(player)) return
  const controlBar = player.getChild("controlBar") as any
  if (!controlBar || controlBar.getChild("IosPictureInPictureButton")) return
  // Insert just before the fullscreen toggle (last child).
  const childCount = (controlBar.children() as unknown[]).length
  controlBar.addChild("IosPictureInPictureButton", {}, childCount - 1)
}

export const VideoPlayer: FC<VideoPlayerProps> = (props) => {
  const { options, onReady } = props
  const videoRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<Player | null>(null)
  const [pipUnavailable, setPipUnavailable] = useState(false)

  useEffect(() => {
    const onPipUnavailable = (event: Event) => {
      const detail = (event as CustomEvent<PiPSupportInfo>).detail
      // Aids remote diagnosis: open desktop Safari → Develop → [device] → Console.
      console.debug("[pip] unavailable", detail)
      setPipUnavailable(true)
    }
    window.addEventListener("app:pip-unavailable", onPipUnavailable)
    return () => window.removeEventListener("app:pip-unavailable", onPipUnavailable)
  }, [])

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      if (!videoRef.current) return

      // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode.
      const videoElement = document.createElement("video-js")

      videoElement.classList.add("vjs-big-play-centered")
      videoRef.current.appendChild(videoElement)

      const player = (playerRef.current = videojs(videoElement, options, () => {
        videojs.log("player is ready")
        console.debug("[pip] support", getPiPSupport(player))
        ensureIosPiPButton(player)
        onReady && onReady(player)
      }))

      // You could update an existing player in the `else` block here
      // on prop change, for example:
    } else {
      const player = playerRef.current

      if (player.currentSrc() === options.sources[0].src) {
        videojs.log("not changed source")
        return
      }
      //player.autoplay(options.autoplay)
      player.options(options)
      player.updateSourceCaches_(options.sources)
      player.poster(options.poster)
      player.src(options.sources)
      //player.src(options.url)
      //player.load()
    }
  }, [videoRef, options, onReady])

  // Dispose the Video.js player when the functional component unmounts
  useEffect(() => {
    const player = playerRef.current

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose()
        playerRef.current = null
      }
    }
  }, [playerRef])

  return (
    <div data-vjs-player>
      <div ref={videoRef} />
      <Snackbar
        open={pipUnavailable}
        autoHideDuration={7000}
        onClose={() => setPipUnavailable(false)}
        message="Picture-in-Picture isn't available in the home-screen app , open this page in Safari for PiP, or use fullscreen."
      />
    </div>
  )
}
