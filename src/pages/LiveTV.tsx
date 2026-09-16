import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAppSelector } from "../store/hooks"
import { selectLiveCategories, selectLiveStreams } from "../store/live/liveSlice"
import Box from "@mui/material/Box"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemText from "@mui/material/ListItemText"
import Badge from "@mui/material/Badge"
import Button from "@mui/material/Button"
import Chip from "@mui/material/Chip"
import Dialog from "@mui/material/Dialog"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import IconButton from "@mui/material/IconButton"
import Paper from "@mui/material/Paper"
import TextField from "@mui/material/TextField"
import InputAdornment from "@mui/material/InputAdornment"
import Typography from "@mui/material/Typography"
import useMediaQuery from "@mui/material/useMediaQuery"
import { useTheme } from "@mui/material/styles"
import { Category, LiveStream } from "../services/XtremeCodesAPI.types"
import { PlayArrowRounded } from "@mui/icons-material"
import SearchRoundedIcon from "@mui/icons-material/SearchRounded"
import FolderRoundedIcon from "@mui/icons-material/FolderRounded"
import CheckRoundedIcon from "@mui/icons-material/CheckRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"
import { glassDialogSlotProps } from "../components/glassDialog"
import { containerToMimeType } from "../services/utils"
import videojs from "video.js"
import Player from "video.js/dist/types/player"
import { VideoPlayer } from "../components/VideoPlayer"
import { useSearchParams } from "react-router-dom"
import { useChannelUrl } from "../components/useMediaUrl"
import { ShortEpgComponent } from "../components/ShortEpgComponent"
import { Virtuoso } from "react-virtuoso"
import { forwardRef } from "react"
import { thinScrollbarSx } from "../components/scrollbar"

const GuideScroller = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => (
  <Box
    ref={ref}
    {...props}
    sx={{
      overflowY: "auto",
      scrollbarWidth: "thin",
      scrollbarColor: "rgba(0,212,255,0.8) transparent",
      "&::-webkit-scrollbar": { width: 6 },
      "&::-webkit-scrollbar-track": { background: "transparent" },
      "&::-webkit-scrollbar-thumb": {
        background: "rgba(0,212,255,0.8)",
        borderRadius: 3,
      },
    }}
  />
))
GuideScroller.displayName = "GuideScroller"

const PickerScroller = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => (
  <Box
    ref={ref}
    {...props}
    sx={{
      overflowY: "auto",
      overflowX: "hidden",
      ...thinScrollbarSx,
    }}
  />
))
PickerScroller.displayName = "PickerScroller"

export const LiveTV: FC = () => {
  const liveStreams = useAppSelector(selectLiveStreams)
  const liveStreamCategories = useAppSelector(selectLiveCategories)
  const [selectedStream, setSelectedStream] = useState<LiveStream | undefined>(
    undefined,
  )
  const [selectedCategory, setSelectedCategory] = useState<
    Category | undefined
  >(undefined)
  const [catPickerOpen, setCatPickerOpen] = useState(false)
  const [catQuery, setCatQuery] = useState("")
  const [channelFilter, setChannelFilter] = useState("")
  const [searchParams, setSearchParams] = useSearchParams()
  const playerRef = useRef<Player | null>(null)
  const url = useChannelUrl(selectedStream?.stream_id ?? 0, "m3u8")
  const theme = useTheme()
  const fullScreenPicker = useMediaQuery(theme.breakpoints.down("sm"))

  const channelId = searchParams.get("channel")

  // Same selection logic as before — URL param drives the player
  useEffect(() => {
    const firstCategory = liveStreamCategories.find(
      (item) => item.category_id !== undefined,
    )

    if (channelId) {
      const stream = liveStreams.find(
        (stream) => stream.stream_id === Number(channelId),
      )
      if (stream) {
        setSelectedStream(stream)
        const category = liveStreamCategories.find(
          (category) => category.category_id === stream.category_id,
        )
        if (category) setSelectedCategory(category)
        else setSelectedCategory(firstCategory)

        return;
      }
    }

    setSelectedCategory(firstCategory)
  }, [channelId, liveStreamCategories, liveStreams])

  const onStreamClick = useCallback((stream: LiveStream) => {
    if (stream.stream_id === undefined) return

    setSearchParams((prev) => {
      prev.set("channel", stream.stream_id!.toString())
      return prev
    })
  }, [setSearchParams])

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const stream of liveStreams) {
      if (stream.category_id !== undefined) {
        const key = String(stream.category_id)
        map.set(key, (map.get(key) ?? 0) + 1)
      }
    }
    return map
  }, [liveStreams])

  const categoryLiveStreams = useMemo(() => {
    const inCategory = liveStreams.filter(
      (stream) => stream.category_id === selectedCategory?.category_id,
    )
    const q = channelFilter.trim().toLocaleLowerCase()
    if (!q) return inCategory
    return inCategory.filter((s) =>
      s.name?.toLocaleLowerCase().includes(q),
    )
  }, [liveStreams, selectedCategory, channelFilter])

  const filteredCategories = useMemo(() => {
    const q = catQuery.trim().toLocaleLowerCase()
    if (!q) return liveStreamCategories
    return liveStreamCategories.filter((c) =>
      c.category_name?.toLocaleLowerCase().includes(q),
    )
  }, [liveStreamCategories, catQuery])

  const pickCategory = useCallback((category: Category) => {
    setSelectedCategory(category)
    setCatPickerOpen(false)
  }, [])

  const videoJsOptions = useCallback(() => {
    return {
      autoplay: true,
      preload: "true",
      controls: true,
      responsive: true,
      fluid: true,
      playsinline: true,
      sources: [
        {
          src: url,
          type: containerToMimeType("m3u8"),
        },
      ],
    }
  }, [url])

  const handlePlayerReady = (player: Player) => {
    playerRef.current = player

    player.on("error", (e: unknown) => {
      console.log(e)
    })

    player.on("waiting", () => {
      videojs.log("player is waiting")
    })

    player.on("dispose", () => {
      videojs.log("player will dispose")
    })
  }

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        overflow: "hidden",
      }}
    >
      {selectedStream && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(0, 0, 0, 0.6)"
                : "rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(20px)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              py: 1.25,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Chip
              size="small"
              color="error"
              icon={<PlayArrowRounded sx={{ fontSize: 14 }} />}
              label="LIVE"
              sx={{ fontWeight: 700, fontSize: "0.65rem", height: 22 }}
            />
            <Typography variant="subtitle1" noWrap sx={{ flex: 1, minWidth: 0, fontWeight: 600 }}>
              {selectedStream.name}
            </Typography>
          </Box>
          {/* Video size is capped relative to the viewport so the channel
              list below always keeps room on the page — only the list scrolls. */}
          <Box
            sx={{
              width: "min(100%, calc(40dvh * 16 / 9))",
              maxWidth: 960,
              mx: "auto",
              p: { xs: 1, sm: 2 },
            }}
          >
            <VideoPlayer options={videoJsOptions()} onReady={handlePlayerReady} />
          </Box>
        </Paper>
      )}

      {/* Guide header — category picker + count + filter */}
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          background: "linear-gradient(to bottom, rgba(255,255,255,0.02), transparent)",
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="outlined"
          startIcon={<FolderRoundedIcon />}
          endIcon={<KeyboardArrowDownRoundedIcon />}
          onClick={() => {
            setCatQuery("")
            setCatPickerOpen(true)
          }}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            maxWidth: { xs: "100%", sm: 320 },
          }}
        >
          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
            {selectedCategory?.category_name ?? "Categories"}
          </Typography>
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
          {categoryLiveStreams.length} channels
        </Typography>
        <TextField
          size="small"
          placeholder="Filter channels…"
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          sx={{ ml: "auto", width: { xs: "100%", sm: 240 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Paper>

      {/* Guide body — takes remaining page height; only this list scrolls. */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, p: 1 }}>
          {categoryLiveStreams.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "text.secondary",
                gap: 1,
              }}
            >
              <Typography variant="h6" color="text.primary">
                {channelFilter ? "No channels match" : "No channels"}
              </Typography>
              <Typography variant="body2">
                {channelFilter
                  ? "Try a different filter."
                  : "Pick another category."}
              </Typography>
            </Box>
          ) : (
            <Virtuoso
              data={categoryLiveStreams}
              computeItemKey={(_, s) => s.stream_id ?? s.name ?? Math.random()}
              itemContent={(_, liveStream) => (
                <Box sx={{ pb: 0.5, pr: 1 }}>
                  <ShortEpgComponent
                    stream={liveStream}
                    onStreamClick={onStreamClick}
                    selected={selectedStream?.stream_id === liveStream.stream_id}
                  />
                </Box>
              )}
              style={{ height: "100%" }}
              components={{
                Scroller: GuideScroller,
              }}
            />
          )}
        </Box>
      </Box>

      {/* Mobile category picker modal — same pattern as Movies/TVShows */}
      <Dialog
        open={catPickerOpen}
        onClose={() => setCatPickerOpen(false)}
        fullScreen={fullScreenPicker}
        maxWidth="xs"
        fullWidth
        scroll="paper"
        slotProps={glassDialogSlotProps}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pr: 1 }}>
          <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 600 }}>
            Browse categories
          </Typography>
          <IconButton
            size="small"
            onClick={() => setCatPickerOpen(false)}
            aria-label="close categories"
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 1.5, pb: 1 }}>
            <TextField
              size="small"
              fullWidth
              autoFocus
              placeholder="Search categories…"
              value={catQuery}
              onChange={(e) => setCatQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
          <Box sx={{ height: fullScreenPicker ? "100%" : 420, minHeight: 0 }}>
            {filteredCategories.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  No categories match “{catQuery}”.
                </Typography>
              </Box>
            ) : (
              <Virtuoso
                data={filteredCategories}
                computeItemKey={(_, c) => c.category_id ?? c.category_name ?? Math.random()}
                components={{ Scroller: PickerScroller }}
                itemContent={(_, category) => {
                  const selected = category === selectedCategory
                  return (
                    <ListItem disablePadding sx={{ px: 1 }}>
                      <ListItemButton
                        selected={selected}
                        onClick={() => pickCategory(category)}
                        sx={{
                          borderRadius: 2,
                          border: "1px solid transparent",
                          "&.Mui-selected": {
                            bgcolor: "rgba(0, 212, 255, 0.12)",
                            borderColor: "rgba(0,212,255,0.35)",
                          },
                        }}
                      >
                        {selected && (
                          <CheckRoundedIcon
                            fontSize="small"
                            color="primary"
                            sx={{ mr: 1 }}
                          />
                        )}
                        <ListItemText
                          primary={category.category_name}
                          slotProps={{
                            primary: {
                              noWrap: true,
                              variant: "body2",
                              sx: { fontWeight: selected ? 600 : 400 },
                            },
                          }}
                        />
                        <Badge
                          badgeContent={categoryCounts.get(String(category.category_id)) ?? 0}
                          color={selected ? "primary" : "default"}
                          sx={{ ml: 1, "& .MuiBadge-badge": { fontSize: 10 } }}
                        />
                      </ListItemButton>
                    </ListItem>
                  )
                }}
              />
            )}
          </Box>
          <Box sx={{ px: 2, py: 1, borderTop: "1px solid", borderColor: "divider" }}>
            <Typography variant="caption" color="text.secondary">
              {filteredCategories.length} of {liveStreamCategories.length} categories
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  )
}
