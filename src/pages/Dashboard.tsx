import { FC, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { selectAppState, selectMediaSource } from "../store/app/selector"
import { urls } from "../services/urls"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Chip from "@mui/material/Chip"
import Divider from "@mui/material/Divider"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import LiveTvRoundedIcon from "@mui/icons-material/LiveTvRounded"
import MovieRoundedIcon from "@mui/icons-material/MovieRounded"
import TvRoundedIcon from "@mui/icons-material/TvRounded"
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded"
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded"
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded"
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded"
import PlaylistPlayRoundedIcon from "@mui/icons-material/PlaylistPlayRounded"
import { getDateForTimestamp } from "../services/utils"
import {
  fetchAccountInfo, removeAccount
} from "../store/app/thunks"
import { setMediaSource } from "../store/app/appSlice"
import { fetchSeriesCategoriesAsync, fetchSeriesStreamsAsync, selectSeriesStreams } from "../store/series/seriesSlice"
import { selectWatchlist } from "../store/watchlist/watchlistSlice"
import { fetchVodCategoriesAsync, fetchVodStreamsAsync, selectVodStreams } from "../store/vod/vodSlice"
import { connectM3UPlaylist, fetchLiveCategoriesAsync, fetchLiveStreamsAsync, selectLiveStreams } from "../store/live/liveSlice"
import { MediaSource } from "../store/types"
import { thinScrollbarSx } from "../components/scrollbar"

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 2,
        py: 1,
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500, textAlign: "right" }}>
        {value}
      </Typography>
    </Box>
  )
}

export const Dashboard: FC = () => {
  const [state, setState] = useState<"loading" | "ready">("ready")
  const [error, setError] = useState("")
  const {
    accountInfo,
    lastFetchedAccountInfo,
  } = useAppSelector(selectAppState)
  const mediaSource = useAppSelector(selectMediaSource)
  const isXtream = mediaSource === null || mediaSource.kind === "xtream"
  const isM3U = mediaSource?.kind === "m3u"
  const seriesStreams = useAppSelector(selectSeriesStreams)
  const watchlist = useAppSelector(selectWatchlist)
  const vodStreams = useAppSelector(selectVodStreams)
  const liveStreams = useAppSelector(selectLiveStreams)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const refreshInfo = () => {
    dispatch(fetchAccountInfo({}))
  }

  const connectText = async (text: string, meta: MediaSource, base?: string) => {
    try {
      await dispatch(connectM3UPlaylist({ text, baseUrl: base })).unwrap()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that playlist")
      setState("ready")
      return
    }
    dispatch(setMediaSource(meta))
    setState("ready")
  }

  const refreshPlaylist = async () => {
    setError("")
    if (isM3U && mediaSource?.origin === "url" && mediaSource.url) {
      setState("loading")
      try {
        const response = await fetch(mediaSource.url)
        if (!response.ok) {
          setError(`Playlist download failed (HTTP ${response.status})`)
          setState("ready")
          return
        }
        const text = await response.text()
        await connectText(text, { ...mediaSource, fetchedAt: Date.now() }, mediaSource.url)
      } catch (e) {
        setError("Could not download that playlist — check the URL")
        console.log(e)
      }
      setState("ready")
      return
    }

    if (isM3U && mediaSource?.origin === "file") {
      // Browsers can't re-read a user file unprompted — open the picker.
      fileInputRef.current?.click()
      return
    }

    setState("loading")
    try {
      await Promise.all([
        dispatch(fetchLiveCategoriesAsync()).unwrap(),
        dispatch(fetchVodCategoriesAsync()).unwrap(),
        dispatch(fetchSeriesCategoriesAsync()).unwrap(),
        dispatch(fetchLiveStreamsAsync()).unwrap(),
        dispatch(fetchVodStreamsAsync()).unwrap(),
        dispatch(fetchSeriesStreamsAsync()).unwrap(),
      ])
    } catch (e) {
      console.log(e)
    }
    setState("ready")
  }

  const handleReplaceFile = async (file: File | undefined) => {
    if (!file || !isM3U) return
    setError("")
    setState("loading")
    try {
      const text = await file.text()
      await connectText(text, {
        kind: "m3u",
        origin: "file",
        fileName: file.name,
        fetchedAt: Date.now(),
      })
    } catch (e) {
      setError("Could not read that file")
      console.log(e)
    }
    setState("ready")
  }

  const deleteAccount = () => {
    dispatch(removeAccount())
  }

  const status = accountInfo.user_info?.status ?? "Unknown"
  const lastRefreshed =
    isM3U && mediaSource?.fetchedAt
      ? new Date(mediaSource.fetchedAt).toLocaleTimeString()
      : new Date(lastFetchedAccountInfo).toLocaleTimeString()
  const stats = [
    {
      label: "Live Channels",
      count: liveStreams.length,
      icon: <LiveTvRoundedIcon color="primary" />,
      url: urls.liveTv,
    },
    {
      label: "Movies",
      count: vodStreams.length,
      icon: <MovieRoundedIcon color="secondary" />,
      url: urls.movies,
    },
    {
      label: "TV Shows",
      count: seriesStreams.length,
      icon: <TvRoundedIcon color="success" />,
      url: urls.tvShows,
    },
    {
      label: "Watchlist",
      count: watchlist.length,
      icon: <BookmarkRoundedIcon color="warning" />,
      url: urls.watchlist,
    },
  ]

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
        ...thinScrollbarSx,
      }}
    >
      <Box sx={{ maxWidth: 960, mx: "auto", pb: 4 }}>
        {/* Header */}
        <Box sx={{ px: 1, pt: 1, pb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Welcome{isXtream && accountInfo.user_info?.username ? `, ${accountInfo.user_info.username}` : ""}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1, flexWrap: "wrap" }}>
            {isXtream ? (
              <>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {accountInfo.server_info?.url}
                </Typography>
                <Chip
                  size="small"
                  icon={<CheckCircleRoundedIcon sx={{ fontSize: 14 }} />}
                  label={status}
                  color={status === "Active" ? "success" : "default"}
                  sx={{ height: 22, fontWeight: 600 }}
                />
              </>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {mediaSource?.origin === "url" ? mediaSource.url : mediaSource?.fileName}
                </Typography>
                <Chip
                  size="small"
                  icon={<PlaylistPlayRoundedIcon sx={{ fontSize: 14 }} />}
                  label="M3U Playlist"
                  color="primary"
                  sx={{ height: 22, fontWeight: 600 }}
                />
              </>
            )}
          </Box>
        </Box>

        {/* Stats */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(4, 1fr)",
            },
            gap: 1.5,
            px: 1,
            pb: 2,
          }}
        >
          {stats.map((s) => (
            <Card
              key={s.label}
              sx={{
                borderRadius: 3,
                cursor: "pointer",
                transition: "transform 0.15s ease, border-color 0.15s ease",
                border: "1px solid",
                borderColor: "divider",
                "&:hover": {
                  transform: "translateY(-2px)",
                  borderColor: "rgba(0,212,255,0.35)",
                },
              }}
              onClick={() => navigate(s.url)}
            >
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5, "&:last-child": { pb: 2 } }}>
                {s.icon}
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" sx={{ lineHeight: 1.2, fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
                    {s.count}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {s.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Account / Source */}
        <Box sx={{ px: 1 }}>
          <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {isXtream ? "Account" : "Playlist source"}
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setError("")}>
                  {error}
                </Alert>
              )}
              {isXtream ? (
              <Box sx={{ mt: 1 }}>
                <DetailRow label="Provider" value={accountInfo.server_info?.url} />
                <Divider />
                <DetailRow label="Username" value={accountInfo.user_info?.username} />
                <Divider />
                <DetailRow label="Status" value={status} />
                <Divider />
                <DetailRow
                  label="Created"
                  value={getDateForTimestamp(
                    accountInfo.user_info?.created_at ?? 0,
                  ).toDateString()}
                />
                <Divider />
                <DetailRow
                  label="Expires"
                  value={getDateForTimestamp(
                    accountInfo.user_info?.exp_date ?? 0,
                  ).toDateString()}
                />
                <Divider />
                <DetailRow
                  label="Trial"
                  value={accountInfo.user_info?.is_trial === 1 ? "Yes" : "No"}
                />
                <Divider />
                <DetailRow label="Max connections" value={accountInfo.user_info?.max_connections} />
                <Divider />
                <DetailRow label="Active connections" value={accountInfo.user_info?.active_cons} />
              </Box>
              ) : (
              <Box sx={{ mt: 1 }}>
                <DetailRow label="Type" value={`M3U playlist (${mediaSource?.origin === "url" ? "URL" : "file"})`} />
                <Divider />
                <DetailRow
                  label={mediaSource?.origin === "url" ? "URL" : "File"}
                  value={mediaSource?.origin === "url" ? mediaSource.url : mediaSource?.fileName}
                />
                <Divider />
                <DetailRow label="Channels" value={liveStreams.length} />
                <Divider />
                <DetailRow
                  label="Saved"
                  value={
                    mediaSource?.fetchedAt
                      ? new Date(mediaSource.fetchedAt).toLocaleString()
                      : "—"
                  }
                />
              </Box>
              )}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2.5 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshRoundedIcon />}
                  loading={state === "loading"}
                  loadingPosition="start"
                  onClick={refreshPlaylist}
                >
                  Update playlist
                </Button>
                {isXtream && (
                  <Button variant="outlined" onClick={refreshInfo}>
                    Refresh account info
                  </Button>
                )}
                <Box sx={{ flexGrow: 1 }} />
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<LogoutRoundedIcon />}
                  onClick={deleteAccount}
                >
                  {isXtream ? "Sign out" : "Remove source"}
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                Last refreshed: {lastRefreshed}
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept=".m3u,.m3u8,audio/x-mpegurl,application/x-mpegurl"
                hidden
                onChange={(e) => {
                  void handleReplaceFile(e.target.files?.[0])
                  e.target.value = ""
                }}
              />
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  )
}
