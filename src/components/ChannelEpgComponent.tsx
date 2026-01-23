import { FC, useMemo } from "react"
import {
  LiveStream,
  LiveStreamEPG,
  LiveStreamEPGItem,
} from "../services/XtremeCodesAPI.types"
import { Box, Grid, ListItem, ListItemContent, Typography, Chip } from "@mui/joy"
import { ChannelCard } from "./ChannelCard"
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded"
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded"
import { isBase64 } from "../services/utils"

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
    if (isBase64(title) && title.length > 20) {
      return atob(title)
    }
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
        borderRadius: "sm",
        backgroundColor: isNowPlaying
          ? "rgba(var(--joy-palette-primary-mainChannel) / 0.15)"
          : "rgba(var(--joy-palette-neutral-mainChannel) / 0.05)",
        border: isNowPlaying ? "1px solid" : "1px solid transparent",
        borderColor: isNowPlaying ? "primary.300" : "transparent",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          backgroundColor: isNowPlaying
            ? "rgba(var(--joy-palette-primary-mainChannel) / 0.25)"
            : "rgba(var(--joy-palette-neutral-mainChannel) / 0.12)",
          transform: "translateY(-2px)",
          boxShadow: "sm",
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
            background: "linear-gradient(90deg, var(--joy-palette-primary-400), var(--joy-palette-primary-500))",
            borderRadius: "0 2px 0 0",
          }}
        />
      )}

      {/* Now Playing Badge */}
      {isNowPlaying && (
        <Chip
          size="sm"
          variant="solid"
          color="primary"
          startDecorator={<PlayArrowRoundedIcon sx={{ fontSize: 14 }} />}
          sx={{
            position: "absolute",
            top: 6,
            right: 6,
            fontSize: "0.65rem",
            height: 20,
          }}
        >
          LIVE
        </Chip>
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
            color: isNowPlaying ? "primary.400" : "neutral.400",
          }}
        />
        <Typography
          level="body-xs"
          sx={{
            color: isNowPlaying ? "primary.400" : "neutral.400",
            fontWeight: 500,
          }}
        >
          {formatTime(item.start_timestamp, item.start)} -{" "}
          {formatTime(item.stop_timestamp, item.end)}
        </Typography>
      </Box>

      {/* Title */}
      <Typography
        level="body-sm"
        sx={{
          fontWeight: isNowPlaying ? 600 : 500,
          color: isNowPlaying ? "primary.plainColor" : "text.primary",
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
    <ListItem>
      <ListItemContent>
        <Grid
          container
          sx={{
            "--Grid-borderWidth": "1px",
            borderTop: "var(--Grid-borderWidth) solid",
            borderBottom: "var(--Grid-borderWidth) solid",
            borderColor: "divider",
            "& > div": {
              borderRight: "var(--Grid-borderWidth) solid",
              borderColor: "divider",
            },
            gap: 0,
            minHeight: 100,
            background:
              "linear-gradient(135deg, rgba(var(--joy-palette-neutral-mainChannel) / 0.02), rgba(var(--joy-palette-neutral-mainChannel) / 0.06))",
          }}
        >
          <Grid sm={2}>
             <Box
              sx={{
                display: "flex",
                alignItems: "stretch",
                gap: 1,
                p: 1,
                height: "100%"}}>
            <ChannelCard
              stream={stream}
              onStreamClick={(stream) => onStreamClick(stream)}
              selected={selected}
            /> </Box>
          </Grid>
          <Grid sm={10}>
            <Box
              sx={{
                display: "flex",
                alignItems: "stretch",
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
                "&::-webkit-scrollbar-thumb": {
                  background: "rgba(var(--joy-palette-neutral-mainChannel) / 0.2)",
                  borderRadius: 3,
                },
                "&::-webkit-scrollbar-thumb:hover": {
                  background: "rgba(var(--joy-palette-neutral-mainChannel) / 0.3)",
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
                    color: "neutral.400",
                  }}
                >
                  <Typography level="body-sm" sx={{ fontStyle: "italic" }}>
                    No program information available
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </ListItemContent>
    </ListItem>
  )
}
