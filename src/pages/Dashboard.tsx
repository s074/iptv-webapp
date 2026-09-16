import { FC, useState } from "react"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { selectAppState } from "../store/app/selector"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import ButtonGroup from "@mui/material/ButtonGroup"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Link from "@mui/material/Link"
import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"
import { styled } from "@mui/material/styles"
import { getDateForTimestamp } from "../services/utils"
import {
  fetchAccountInfo
} from "../store/app/thunks"
import { removeAccount } from "../store/app/appSlice"
import { fetchSeriesCategoriesAsync, fetchSeriesStreamsAsync, selectSeriesStreams } from "../store/series/seriesSlice"
import { selectWatchlist } from "../store/watchlist/watchlistSlice"
import { fetchVodCategoriesAsync, fetchVodStreamsAsync, selectVodStreams } from "../store/vod/vodSlice"
import { fetchLiveCategoriesAsync, fetchLiveStreamsAsync, selectLiveStreams } from "../store/live/liveSlice"

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

  console.log(accountInfo)

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

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        overflow: "auto",
        paddingBottom: 5,
      }}
    >
      <Card
        sx={{
          width: "100%",
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="h6"
            align="center"
            sx={{ pb: 5 }}
          >
            Your Account
          </Typography>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              flexGrow: 1,
              columnGap: 40,
              rowGap: 5,
            }}
          >
            <Item>
              <b>Provider</b>
            </Item>
            <Item>{accountInfo.server_info?.url}</Item>
            <Item>
              <b>Username</b>
            </Item>
            <Item>{accountInfo.user_info?.username}</Item>
            <Item>
              <b>Account Status</b>
            </Item>
            <Item>{accountInfo.user_info?.status}</Item>
            <Item>
              <b>Creation Date</b>
            </Item>
            <Item>
              {getDateForTimestamp(
                accountInfo.user_info?.created_at ?? 0,
              ).toDateString()}
            </Item>
            <Item>
              <b>Expire Date</b>
            </Item>
            <Item>
              {getDateForTimestamp(
                accountInfo.user_info?.exp_date ?? 0,
              ).toDateString()}
            </Item>
            <Item>
              <b>Is Trial</b>
            </Item>
            <Item>{accountInfo.user_info?.is_trial === 1 ? "Yes" : "No"}</Item>
            <Item>
              <b>Max Connections</b>
            </Item>
            <Item>{accountInfo.user_info?.max_connections}</Item>
            <Item>
              <b>Active Connections</b>
            </Item>
            <Item>{accountInfo.user_info?.active_cons}</Item>
          </div>
          <Paper
            sx={{
              bgcolor: "background.default",
              borderRadius: 1,
              p: 1.5,
              my: 1.5,
              display: "flex",
              gap: 2,
              "& > div": { flex: 1 },
              justifyContent: "center",
              alignContent: "center",
            }}
          >
            <div>
              <Typography
                variant="caption"
                align="center"
                sx={{ justifyContent: "center", fontWeight: "bold", display: "flex" }}
              >
                Live Channels
              </Typography>
              <Typography
                align="center"
                sx={{ justifyContent: "center", fontWeight: "bold", display: "flex" }}
              >
                {liveStreams.length}
              </Typography>
            </div>
            <div>
              <Typography
                variant="caption"
                align="center"
                sx={{ justifyContent: "center", fontWeight: "bold", display: "flex" }}
              >
                Movies
              </Typography>
              <Typography
                align="center"
                sx={{ justifyContent: "center", fontWeight: "bold", display: "flex" }}
              >
                {vodStreams.length}
              </Typography>
            </div>
            <div>
              <Typography
                variant="caption"
                align="center"
                sx={{ justifyContent: "center", fontWeight: "bold", display: "flex" }}
              >
                TV Shows
              </Typography>
              <Typography
                align="center"
                sx={{ justifyContent: "center", fontWeight: "bold", display: "flex" }}
              >
                {seriesStreams.length}
              </Typography>
            </div>
            <div>
              <Typography
                variant="caption"
                align="center"
                sx={{ justifyContent: "center", fontWeight: "bold", display: "flex" }}
              >
                Watchlist
              </Typography>
              <Typography
                align="center"
                sx={{ justifyContent: "center", fontWeight: "bold", display: "flex" }}
              >
                {watchlist.length}
              </Typography>
            </div>
          </Paper>
          <ButtonGroup
            sx={{ justifyContent: "space-between", margin: 5, display: "flex", gap: 1 }}
          >
            <Button variant="contained" color="error" onClick={deleteAccount}>
              Sign out
            </Button>
            <Button
              variant="contained"
              color="primary"
              loading={state === "loading"}
              loadingPosition="start"
              onClick={refreshPlaylist}
            >
              Update playlist
            </Button>
          </ButtonGroup>
          <div
            style={{ display: "flex", justifyContent: "center", marginTop: 5 }}
          >
            <Typography>
              Last refreshed:
              {" " + new Date(lastFetchedAccountInfo).toLocaleTimeString()}
            </Typography>
            <Link sx={{ marginLeft: 2 }} onClick={refreshInfo}>
              Refresh Account Information
            </Link>
          </div>
        </CardContent>
      </Card>
    </Box>
  )
}

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.action.hover,
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  borderRadius: 4,
  color: theme.palette.text.secondary,
}))
