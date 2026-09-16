import { FC, useEffect, useRef } from "react"
import videojs from "video.js"
import Player from "video.js/dist/types/player"
import "video.js/dist/video-js.css"

export interface VideoPlayerProps {
  options: any
  onReady?: (player: Player) => void
}

// iOS Safari implements neither document.pictureInPictureEnabled nor
// el.requestPictureInPicture() — the only PiP path video.js speaks.
// It only exposes the WebKit-prefixed presentation-mode API on the
// <video> element, so video.js's built-in toggle stays disabled on
// iPhones. This button covers that path (and only that path — where
// the standard API exists, the built-in toggle keeps working).
interface WebkitPresentationVideo extends HTMLVideoElement {
  webkitSetPresentationMode?: (
    mode: "inline" | "picture-in-picture" | "fullscreen",
  ) => void
  webkitSupportsPresentationMode?: (mode: string) => boolean
  webkitPresentationMode?: string
  webkitDisplayingFullscreen?: boolean
  webkitExitFullscreen?: () => void
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

function canUseIosPiP(player: Player): boolean {
  if (typeof document !== "undefined") {
    const doc = document as Document & { pictureInPictureEnabled?: boolean }
    // Standard API present (desktop/Android) — the built-in toggle handles it.
    if (doc.pictureInPictureEnabled) return false
  }
  const el = getTechVideoEl(player)
  if (!el || typeof el.webkitSetPresentationMode !== "function") return false
  if (typeof el.webkitSupportsPresentationMode === "function") {
    try {
      return el.webkitSupportsPresentationMode("picture-in-picture")
    } catch {
      return false
    }
  }
  return true
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
        if (!el?.webkitSetPresentationMode) return
        try {
          if (el.webkitPresentationMode === "picture-in-picture") {
            el.webkitSetPresentationMode("inline")
            return
          }
          if (el.webkitDisplayingFullscreen && el.webkitExitFullscreen) {
            // iOS refuses PiP straight from native fullscreen — step out first.
            el.webkitExitFullscreen()
            window.setTimeout(() => {
              try {
                el.webkitSetPresentationMode?.("picture-in-picture")
              } catch {
                // ignore — likely tapped before metadata loaded
              }
            }, 350)
            return
          }
          el.webkitSetPresentationMode("picture-in-picture")
        } catch {
          // ignore — iOS throws if tapped before metadata loads
        }
      }
    }
    videojs.registerComponent(
      "IosPictureInPictureButton",
      IosPictureInPictureButton as any,
    )
    iosPiPRegistered = true
  }

  if (!canUseIosPiP(player)) return
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
    </div>
  )
}
