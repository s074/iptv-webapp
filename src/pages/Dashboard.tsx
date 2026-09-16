import { FC, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { selectAppState } from "../store/app/selector"
import { urls } from "../services/urls"
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
import { getDateForTimestamp } from "../services/utils"
import {
  fetchAccountInfo
} from "../store/app/thunks"
import { removeAccount } from "../store/app/appSlice"
import { fetchSeriesCategoriesAsync, fetchSeriesStreamsAsync, selectSeriesStreams } from "../store/series/seriesSlice"
import { selectWatchlist } from "../store/watchlist/watchlistSlice"
import { fetchVodCategoriesAsync, fetchVodStreamsAsync, selectVodStreams } from "../store/vod/vodSlice"
import { fetchLiveCategoriesAsync, fetchLiveStreamsAsync, selectLiveStreams } from "../store/live/liveSlice"
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
  const {
    accountInfo,
    lastFetchedAccountInfo,
  } = useAppSelector(selectAppState)
  const seriesStreams = useAppSelector(selectSeriesStreams)
  const watchlist = useAppSelector(selectWatchlist)
  const vodStreams = useAppSelector(selectVodStreams)
  const liveStreams = useAppSelector(selectLiveStreams)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const refreshInfo = () => {
    dispatch(fetchAccountInfo({}))
  }

  const refreshPlaylist = async () => {
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

  const deleteAccount = () => {
    dispatch(removeAccount())
  }

  const status = accountInfo.user_info?.status ?? "Unknown"
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
            Welcome{accountInfo.user_info?.username ? `, ${accountInfo.user_info.username}` : ""}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1, flexWrap: "wrap" }}>
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

        {/* Account */}
        <Box sx={{ px: 1 }}>
          <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Account
              </Typography>
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
                <Button variant="outlined" onClick={refreshInfo}>
                  Refresh account info
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<LogoutRoundedIcon />}
                  onClick={deleteAccount}
                >
                  Sign out
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                Last refreshed: {new Date(lastFetchedAccountInfo).toLocaleTimeString()}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  )
}
