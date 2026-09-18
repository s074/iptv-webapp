import { FC } from "react"
import Typography from "@mui/material/Typography"
import {
  AudioInformation,
  VideoInformation,
} from "../services/XtremeCodesAPI.types"
import { summarizeQuality } from "../services/mediaSpecs"

function SpecRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <Typography>
      <b>{label}:</b> {value}
    </Typography>
  )
}

export interface MediaSpecsProps {
  container?: unknown
  video?: VideoInformation
  audio?: AudioInformation
  durationSecs?: unknown
  duration?: unknown
  showDuration?: boolean
  heading?: string
}

// Renders nothing when the provider sent no usable specs (common —
// providers vary wildly in what ffprobe data they include).
export const MediaSpecs: FC<MediaSpecsProps> = (props) => {
  const {
    container,
    video,
    audio,
    durationSecs,
    duration,
    showDuration = true,
    heading = "Stream quality",
  } = props
  const { summary, hasSpecs } = summarizeQuality({
    container,
    video,
    audio,
    durationSecs,
    duration,
  })
  if (!hasSpecs) return null

  return (
    <>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2, mb: 0.5 }}>
        {heading}
      </Typography>
      <SpecRow label="Container" value={summary.container} />
      <SpecRow label="Resolution" value={summary.resolution} />
      <SpecRow label="Video codec" value={summary.videoCodec} />
      <SpecRow label="Frame rate" value={summary.frameRate} />
      <SpecRow label="Video bitrate" value={summary.videoBitrate} />
      <SpecRow label="Audio codec" value={summary.audioCodec} />
      <SpecRow label="Audio" value={summary.audioChannels} />
      <SpecRow label="Sample rate" value={summary.audioRate} />
      <SpecRow label="Audio language" value={summary.audioLanguage} />
      {showDuration && <SpecRow label="Duration" value={summary.duration} />}
    </>
  )
}
