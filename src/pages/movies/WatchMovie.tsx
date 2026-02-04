import { FC, useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import { VideoPlayer } from "../../components/VideoPlayer"
import { useAppSelector } from "../../store/hooks"
import { selectVodStreams } from "../../store/vod/vodSlice"
import { VodStream } from "../../services/XtremeCodesAPI.types"
import Player from "video.js/dist/types/player"
import videojs from "video.js"
import { containerToMimeType } from "../../services/utils"
import { VodInfoComponent } from "../../components/VodInfoComponent"
import { Box, Container } from "@mui/joy"
import { useVodUrl } from "../../components/useMediaUrl"

export const WatchMovie: FC = () => {
  const { id } = useParams()
  const vodStreams = useAppSelector(selectVodStreams)
  const [stream, setStream] = useState<VodStream | undefined>(undefined)
  const playerRef = useRef<Player | null>(null)

  useEffect(() => {
    const stream = vodStreams.find((stream) => stream.stream_id === Number(id))

    if (!stream) return

    setStream(stream)
  }, [id, vodStreams])

  const url = useVodUrl(
    stream?.stream_id ?? 0,
    stream?.container_extension ?? "",
  )

  const videoJsOptions = {
    autoplay: false,
    controls: true,
    responsive: true,
    fluid: true,
    fill: true,
    sources: [
      {
        src: url,
        type: containerToMimeType(stream?.container_extension ?? ""),
      },
    ],
    poster: stream?.stream_icon,
    preload: "none",
  }

  const handlePlayerReady = (player: Player) => {
    playerRef.current = player

    // You can handle player events here, for example:
    player.on("waiting", () => {
      videojs.log("player is waiting")
    })

    player.on("dispose", () => {
      videojs.log("player will dispose")
    })
  }

  return (
    <Box>
      {stream && (
        <>
          <Container maxWidth="lg">
            <VideoPlayer options={videoJsOptions} onReady={handlePlayerReady} />
          </Container>
          <Box>
            <VodInfoComponent vod={stream} />
          </Box>
        </>
      )}
      {!stream && <div>There was an error loadig that title</div>}
    </Box>
  )
}
