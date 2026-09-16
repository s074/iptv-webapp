import { FC, memo, useMemo } from "react"
import {
  LiveStream,
  LiveStreamEPG,
  LiveStreamEPGItem,
} from "../services/XtremeCodesAPI.types"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Chip from "@mui/material/Chip"
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded"
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded"
import LiveTvRoundedIcon from "@mui/icons-material/LiveTvRounded"
import { b64DecodeUnicode } from "../services/utils"

export interface ChannelEpgProps {
  epg: LiveStreamEPG | undefined
  offset: number
  onStreamClick: (stream: LiveStream) => void
  stream: LiveStream
  selected?: boolean
  hideChannelInfo?: boolean
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
    const decodedTitle = b64DecodeUnicode(title);
    return decodedTitle;
  } catch {
    // Not base64, return as-is
  }
  return title
}

const EpgItem: FC<{ item: LiveStreamEPGItem }> = memo(({ item }) => {
  const nowSec = Date.now() / 1000
  const isNowPlaying =
    item.now_playing === 1 ||
    (!!item.start_timestamp &&
      !!item.stop_timestamp &&
      item.start_timestamp < nowSec &&
      item.stop_timestamp > nowSec)
  const progress = getProgress(item)
  const title = decodeTitle(item.title)

  return (
    <Box
      sx={{
        minWidth: 210,
        maxWidth: 280,
        p: 1.5,
        position: "relative",
        overflow: "hidden",
        borderRadius: 2,
        bgcolor: isNowPlaying
          ? "rgba(0, 212, 255, 0.10)"
          : "rgba(255,255,255,0.03)",
        border: "1px solid",
        borderColor: isNowPlaying
          ? "rgba(0,212,255,0.45)"
          : "rgba(255,255,255,0.06)",
        transition: "transform 0.15s ease, border-color 0.15s ease, background 0.15s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: "rgba(0,212,255,0.35)",
        },
      }}
    >
      {isNowPlaying && progress > 0 && (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: 3,
            width: `${progress}%`,
            background: "linear-gradient(90deg, #00d4ff, #1976d2)",
          }}
        />
      )}

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
            fontWeight: 700,
            height: 20,
          }}
        />
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
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
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatTime(item.start_timestamp, item.start)} -{" "}
          {formatTime(item.stop_timestamp, item.end)}
        </Typography>
      </Box>

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
})
EpgItem.displayName = "EpgItem"

export const ChannelEpgComponent: FC<ChannelEpgProps> = memo((props) => {
  const { epg, stream, onStreamClick, selected, hideChannelInfo = false } = props

  // Sort EPG listings by start time and filter to reasonable window
  // (same logic as before — looks only)
  const sortedListings = useMemo(() => {
    if (!epg?.epg_listings?.length) return []
    const now = Date.now() / 1000
    return [...epg.epg_listings]
      .filter((item) => {
        const end = item.stop_timestamp ?? Infinity
        return end > now - 3600
      })
      .sort((a, b) => (a.start_timestamp ?? 0) - (b.start_timestamp ?? 0))
      .slice(0, 10)
  }, [epg?.epg_listings])

  return (
    <Box
      onClick={() => onStreamClick(stream)}
      sx={{
        display: "flex",
        alignItems: "stretch",
        gap: 0,
        minHeight: 76,
        borderRadius: 2,
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        bgcolor: selected ? "rgba(0,212,255,0.08)" : "transparent",
        border: "1px solid transparent",
        borderColor: selected ? "rgba(0,212,255,0.45)" : "transparent",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        transition: "background 0.15s ease",
        "&:hover": { bgcolor: "rgba(255,255,255,0.03)" },
        ...(selected
          ? {
              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: 10,
                bottom: 10,
                width: 3,
                borderRadius: "0 3px 3px 0",
                background: "#00d4ff",
                boxShadow: "0 0 12px rgba(0,212,255,0.8)",
              },
            }
          : {}),
      }}
    >
      {!hideChannelInfo && (
      <Box
        sx={{
          width: { xs: 180, sm: 264 },
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1,
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 1.5,
            overflow: "hidden",
            flexShrink: 0,
            bgcolor: "rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {stream.stream_icon ? (
            <Box
              component="img"
              src={stream.stream_icon}
              alt=""
              loading="lazy"
              sx={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <LiveTvRoundedIcon fontSize="small" sx={{ color: "text.disabled" }} />
          )}
        </Box>
        <Typography
          variant="body2"
          noWrap
          title={stream.name}
          sx={{ flex: 1, minWidth: 0, fontWeight: selected ? 600 : 500 }}
        >
          {stream.name}
        </Typography>
      </Box>
      )}

      {/* Programs — horizontal scroll, thin scrollbar */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "stretch",
          gap: 1,
          p: 1,
          overflowX: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.15) transparent",
          "&::-webkit-scrollbar": { height: 6 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(255,255,255,0.15)",
            borderRadius: 3,
          },
          "&::-webkit-scrollbar-thumb:hover": { background: "#00d4ff" },
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
              px: 1,
              color: "text.disabled",
            }}
          >
            <Typography variant="body2" sx={{ fontStyle: "italic" }} noWrap>
              No program info
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
})
ChannelEpgComponent.displayName = "ChannelEpgComponent"
