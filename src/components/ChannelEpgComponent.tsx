import { FC, useMemo } from "react"
import {
  LiveStream,
  LiveStreamEPG,
  LiveStreamEPGItem,
} from "../services/XtremeCodesAPI.types"
import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import Typography from "@mui/material/Typography"
import Chip from "@mui/material/Chip"
import { ChannelCard } from "./ChannelCard"
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded"
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded"
import { b64DecodeUnicode } from "../services/utils"

export interface ChannelEpgProps {
  epg: LiveStreamEPG | undefined
  offset: number
  onStreamClick: (stream: LiveStream) => void
  stream: LiveStream
  selected?: boolean
}

// Helper to format time from timestamp or ISO string
const formatTime = (timestamp?: number, timeStr?: string): string => {
  if (timestamp) {
    return new Date(timestamp * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }
  if (timeStr) {
    const date = new Date(timeStr)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  return ""
}

// Calculate progress percentage for currently airing shows
const getProgress = (item: LiveStreamEPGItem): number => {
  const now = Date.now() / 1000
  const start = item.start_timestamp ?? 0
  const end = item.stop_timestamp ?? 0
  if (start && end && now >= start && now <= end) {
    return ((now - start) / (end - start)) * 100
  }
  return 0
}

// Decode base64 title if needed (some EPG sources encode titles)
const decodeTitle = (title?: string): string => {
  if (!title) return "Unknown Program"
  try {
    // Check if it looks like base64
    const decodedTitle = b64DecodeUnicode(title);
    return decodedTitle;
  } catch {
    // Not base64, return as-is
  }
  return title
}

const EpgItem: FC<{ item: LiveStreamEPGItem }> = ({ item }) => {
  const isNowPlaying = item.now_playing === 1 || ( !!item.start_timestamp && !!item.stop_timestamp && item.start_timestamp < Date.now() / 1000 && item.stop_timestamp > Date.now() / 1000)
  const progress = getProgress(item)
  const title = decodeTitle(item.title)

  return (
    <Box
      sx={{
        minWidth: 200,
        maxWidth: 280,
        height: "100%",
        p: 1.5,
        position: "relative",
        overflow: "hidden",
        borderRadius: 1,
        backgroundColor: isNowPlaying
          ? "rgba(25, 118, 210, 0.15)"
          : "rgba(128, 128, 128, 0.05)",
        border: isNowPlaying ? "1px solid" : "1px solid transparent",
        borderColor: isNowPlaying ? "primary.light" : "transparent",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 1,
        },
      }}
    >
      {/* Progress bar for currently airing */}
      {isNowPlaying && progress > 0 && (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: 3,
            width: `${progress}%`,
            background: "linear-gradient(90deg, #42a5f5, #1976d2)",
            borderRadius: "0 2px 0 0",
          }}
        />
      )}

      {/* Now Playing Badge */}
      {isNowPlaying && (
        <Chip
          size="small"
          color="primary"
          icon={<PlayArrowRoundedIcon sx={{ fontSize: 14 }} />}
          label="LIVE"
          sx={{
            position: "absolute",
            top: 6,
            right: 6,
            fontSize: "0.65rem",
            height: 20,
          }}
        />
      )}

      {/* Time */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          mb: 0.5,
        }}
      >
        <AccessTimeRoundedIcon
          sx={{
            fontSize: 12,
            color: isNowPlaying ? "primary.light" : "text.disabled",
          }}
        />
        <Typography
          variant="caption"
          sx={{
            color: isNowPlaying ? "primary.light" : "text.disabled",
            fontWeight: 500,
          }}
        >
          {formatTime(item.start_timestamp, item.start)} -{" "}
          {formatTime(item.stop_timestamp, item.end)}
        </Typography>
      </Box>

      {/* Title */}
      <Typography
        variant="body2"
        sx={{
          fontWeight: isNowPlaying ? 600 : 500,
          lineHeight: 1.3,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          pr: isNowPlaying ? 5 : 0,
        }}
      >
        {title}
      </Typography>
    </Box>
  )
}

export const ChannelEpgComponent: FC<ChannelEpgProps> = (props) => {
  const { epg, offset, stream, onStreamClick, selected } = props

  // Sort EPG listings by start time and filter to reasonable window
  const sortedListings = useMemo(() => {
    if (!epg?.epg_listings?.length) return []
    const now = Date.now() / 1000
    return [...epg.epg_listings]
      .filter((item) => {
        // Show items that haven't ended yet or are within 24h window
        const end = item.stop_timestamp ?? Infinity
        return end > now - 3600 // Include recently ended (within 1hr)
      })
      .sort((a, b) => (a.start_timestamp ?? 0) - (b.start_timestamp ?? 0))
      .slice(0, 10) // Limit to 10 items for performance
  }, [epg?.epg_listings])

  return (
    <Grid
      container
      sx={{
        borderTop: "1px solid",
        borderBottom: "1px solid",
        borderColor: "divider",
        gap: 0,
        minHeight: 100,
      }}
    >
      <Grid size={{ xs: 12, sm: 2 }}>
         <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            p: 1,
            width: 100,
            height: 100
          }}>
        <ChannelCard
          stream={stream}
          onStreamClick={(stream) => onStreamClick(stream)}
          selected={selected}
        /> </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 12, md: 10 }}>
        <Box
          sx={{
            display: "flex",
            gap: 1,
            p: 1,
            overflowX: "auto",
            height: "100%",
            "&::-webkit-scrollbar": {
              height: 6,
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
          }}
        >
          {sortedListings.length > 0 ? (
            sortedListings.map((item, index) => (
              <EpgItem key={item.id ?? `epg-${index}`} item={item} />
            ))
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                color: "text.disabled",
              }}
            >
              <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                No program information available
              </Typography>
            </Box>
          )}
        </Box>
      </Grid>
    </Grid>
  )
}
