import { FC, memo, useMemo, useState } from "react"
import {
  LiveStream,
  LiveStreamEPG,
  LiveStreamEPGItem,
} from "../services/XtremeCodesAPI.types"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Chip from "@mui/material/Chip"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import ListItemIcon from "@mui/material/ListItemIcon"
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded"
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded"
import LiveTvRoundedIcon from "@mui/icons-material/LiveTvRounded"
import StarRoundedIcon from "@mui/icons-material/StarRounded"
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded"
import { b64DecodeUnicode } from "../services/utils"
import { useEpgOffsets } from "../services/epgTime"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import {
  addToFavorites,
  removeFromFavorites,
  selectFavorites,
} from "../store/live/liveSlice"

export interface ChannelEpgProps {
  epg: LiveStreamEPG | undefined
  offset: number
  onStreamClick: (stream: LiveStream) => void
  stream: LiveStream
  selected?: boolean
  hideChannelInfo?: boolean
}

// Xtream backends send epoch timestamps as strings ("1789608600").
// Normalize to numbers up front , implicit coercion and strict checks
// like `now_playing === 1` silently fail on strings.
const toEpochSeconds = (value: number | string | undefined): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined
  const num = Number(value)
  return Number.isFinite(num) ? num : undefined
}

// Helper to format time from timestamp or ISO string.
// Wall-clock strings from Xtream ("2026-09-17 01:30:00") carry no zone
// and are UTC , parsing them as local time would shift every listing
// by the device's UTC offset. offsetMinutes corrects feeds whose epochs
// are stamped off from the real broadcast (see services/epgTime.ts).
const formatTime = (
  timestamp?: number | string,
  timeStr?: string,
  offsetMinutes: number = 0,
): string => {
  const epoch = toEpochSeconds(timestamp)
  if (epoch !== undefined) {
    return new Date((epoch + offsetMinutes * 60) * 1000).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    )
  }
  if (timeStr) {
    const asUtc = new Date(timeStr.replace(" ", "T") + "Z")
    if (!Number.isNaN(asUtc.getTime())) {
      return new Date(
        asUtc.getTime() + offsetMinutes * 60 * 1000,
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    }
    const date = new Date(timeStr)
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }
  return ""
}

// Calculate progress percentage for currently airing shows
const getProgress = (
  item: LiveStreamEPGItem,
  offsetMinutes: number = 0,
): number => {
  const now = Date.now() / 1000
  const rawStart = toEpochSeconds(item.start_timestamp)
  const rawEnd = toEpochSeconds(item.stop_timestamp)
  const start = rawStart === undefined ? 0 : rawStart + offsetMinutes * 60
  const end = rawEnd === undefined ? 0 : rawEnd + offsetMinutes * 60
  if (start && end && now >= start && now <= end) {
    return ((now - start) / (end - start)) * 100
  }
  return 0
}

// Decode base64 title if needed (Xtream encodes titles; XMLTV does not,
// those items set titleEncoded: false, since short plain titles can
// otherwise false-positive as base64 and come out garbled).
const decodeTitle = (title?: string, encoded?: boolean): string => {
  if (!title) return "Unknown Program"
  if (encoded === false) return title
  try {
    const decodedTitle = b64DecodeUnicode(title);
    return decodedTitle;
  } catch {
    // Not base64, return as-is
  }
  return title
}

const EpgItem: FC<{ item: LiveStreamEPGItem }> = memo(({ item }) => {
  // Each listing carries its guide source; corrections are per-source.
  const offsets = useEpgOffsets()
  const offsetMinutes = item.sourceId ? (offsets[item.sourceId] ?? 0) : 0
  const nowSec = Date.now() / 1000
  const rawStart = toEpochSeconds(item.start_timestamp)
  const rawStop = toEpochSeconds(item.stop_timestamp)
  const start =
    rawStart === undefined ? undefined : rawStart + offsetMinutes * 60
  const stop =
    rawStop === undefined ? undefined : rawStop + offsetMinutes * 60
  const flaggedNowPlaying = Number(item.now_playing) === 1
  const isNowPlaying =
    flaggedNowPlaying ||
    (start !== undefined &&
      stop !== undefined &&
      start < nowSec &&
      stop > nowSec)
  const progress = getProgress(item, offsetMinutes)
  const title = decodeTitle(item.title, item.titleEncoded)

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
          {formatTime(item.start_timestamp, item.start, offsetMinutes)} -{" "}
          {formatTime(item.stop_timestamp, item.end, offsetMinutes)}
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
  const offsets = useEpgOffsets()
  const dispatch = useAppDispatch()
  const favorites = useAppSelector(selectFavorites)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  const isFavorite = favorites.some(
    (fav) => String(fav.stream_id) === String(stream.stream_id),
  )

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    setContextMenu({ x: event.clientX, y: event.clientY })
  }

  const handleToggleFavorite = (event: React.MouseEvent) => {
    // The menu lives in a portal: without this, the click bubbles through
    // the React tree into the row's onClick and plays the channel.
    event.stopPropagation()
    if (isFavorite) dispatch(removeFromFavorites(stream))
    else dispatch(addToFavorites(stream))
    setContextMenu(null)
  }

  const handleMenuClose = (
    event: object,
    reason: "backdropClick" | "escapeKeyDown",
  ) => {
    // Same portal bubbling as above: a dismiss click on the backdrop would
    // otherwise reach the row and play the channel.
    if (reason === "backdropClick") {
      ;(event as unknown as { stopPropagation?: () => void }).stopPropagation?.()
    }
    setContextMenu(null)
  }

  // Sort EPG listings by start time and filter to reasonable window.
  // Both steps use per-listing corrected epochs: sources can carry
  // different corrections, so raw epochs are neither comparable across
  // sources nor anchored to absolute time.
  const sortedListings = useMemo(() => {
    if (!epg?.epg_listings?.length) return []
    const now = Date.now() / 1000
    const correctedStart = (item: LiveStreamEPGItem): number => {
      const raw = toEpochSeconds(item.start_timestamp) ?? 0
      const offset = item.sourceId ? (offsets[item.sourceId] ?? 0) : 0
      return raw + offset * 60
    }
    const correctedStop = (item: LiveStreamEPGItem): number | undefined => {
      const raw = toEpochSeconds(item.stop_timestamp)
      if (raw === undefined) return undefined
      const offset = item.sourceId ? (offsets[item.sourceId] ?? 0) : 0
      return raw + offset * 60
    }
    return [...epg.epg_listings]
      .filter((item) => {
        // Show items that haven't ended yet or ended within the last hour
        const end = correctedStop(item) ?? Infinity
        return end > now - 3600
      })
      .sort((a, b) => correctedStart(a) - correctedStart(b))
      .slice(0, 10) // Limit to 10 items for performance
  }, [epg?.epg_listings, offsets])

  return (
    <Box
      onClick={() => onStreamClick(stream)}
      onContextMenu={handleContextMenu}
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
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1,
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {isFavorite && (
          <StarRoundedIcon
            fontSize="small"
            sx={{
              position: "absolute",
              top: 2,
              left: 2,
              color: "#ffd54f",
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))",
            }}
          />
        )}
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

      {/* Programs , horizontal scroll, thin scrollbar */}
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
      <Menu
        open={contextMenu !== null}
        onClose={handleMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu ? { top: contextMenu.y, left: contextMenu.x } : undefined
        }
      >
        <MenuItem onClick={handleToggleFavorite}>
          <ListItemIcon>
            {isFavorite ? (
              <StarRoundedIcon fontSize="small" color="primary" />
            ) : (
              <StarBorderRoundedIcon fontSize="small" />
            )}
          </ListItemIcon>
          {isFavorite ? "Remove from favorites" : "Add to favorites"}
        </MenuItem>
      </Menu>
    </Box>
  )
})
ChannelEpgComponent.displayName = "ChannelEpgComponent"
