import { FC, useEffect, useState } from "react"
import { VodInfo, VodStream } from "../services/XtremeCodesAPI.types"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Grid from "@mui/material/Grid"
import Typography from "@mui/material/Typography"
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { fetchVodInfoAsync } from "../store/vod/vodSlice"
import { YoutubeVideo } from "./YoutubeVideo"
import { Loading } from "./layout/Loading"
import { MediaSpecs } from "./MediaSpecs"
import { selectWatchlist, addToWatchlist, removeFromWatchlist } from "../store/watchlist/watchlistSlice"
import { useVodUrl } from "./useMediaUrl"
import { copyTextToClibpboard, isVlcPlatform, openInVlc } from "../services/utils"

export interface VodInfoProps {
  vod: VodStream
  playButton?: JSX.Element
}

export const VodInfoComponent: FC<VodInfoProps> = (props) => {
  const { vod, playButton } = props
  const [info, setInfo] = useState<VodInfo | undefined>(undefined)
  const [trailerVisible, setTrailerVisible] = useState(false)
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")
  const watchlist = useAppSelector(selectWatchlist)
  const dispatch = useAppDispatch()
  const url = useVodUrl(vod?.stream_id ?? 0, vod?.container_extension ?? "")

  useEffect(() => {
    if (!vod || !vod.stream_id) return

    dispatch(fetchVodInfoAsync({ vodId: vod.stream_id }))
      .unwrap()
      .then((info) => {
        setInfo(info)
        setState("ready")
      })
      .catch((e) => {
        console.log(e)
        setState("error")
      })
  }, [dispatch, vod])

  if (state === "loading") return <Loading />

  const toggleWatchlist = () => {
    if (vod.stream_id === undefined) return

    if (
      watchlist.find(
        (element) => element.id === vod.stream_id && element.type === "vod",
      )
    ) {
      dispatch(removeFromWatchlist({ id: vod.stream_id, type: "vod" }))
    } else {
      dispatch(addToWatchlist({ id: vod.stream_id, type: "vod" }))
    }
  }

  const onClickCopy = async () => {
    await copyTextToClibpboard(url)
  }

  const showTrailer = trailerVisible && info?.info?.youtube_trailer

  return (
    <Grid
      container
      spacing={2}
      sx={{
        flexGrow: 1,
        justifyContent: "center",
        marginTop: 1,
      }}
    >
      <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
        {showTrailer && <YoutubeVideo id={info?.info?.youtube_trailer ?? ""} />}
        {!showTrailer && (
          <Box
            component="img"
            src={vod.stream_icon}
            alt=""
            sx={{
              width: "100%",
              maxWidth: { xs: 200, md: 260 },
              objectFit: "contain",
              borderRadius: 2,
            }}
          />
        )}
      </Grid>
      <Grid size={{ xs: 12, md: 8 }} sx={{ minWidth: 0 }}>
        <div style={{ justifyContent: "center" }}>
          {state === "ready" && (
            <>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {info?.info?.plot}
              </Typography>
              {info?.info?.o_name && info.info.o_name !== info.info.name && (
                <Typography>
                  <b>Original title:</b> {info?.info?.o_name}
                </Typography>
              )}
              <Typography>
                <b>Release Date:</b> {info?.info?.releasedate}
              </Typography>
              <Typography>
                <b>Duration:</b> {info?.info?.duration}
              </Typography>
              <Typography>
                <b>Genre:</b> {info?.info?.genre}
              </Typography>
              <Typography>
                <b>Directed By:</b> {info?.info?.director}
              </Typography>
              <Typography>
                <b>Cast:</b> {info?.info?.cast}
              </Typography>
              {info?.info?.country && (
                <Typography>
                  <b>Country:</b> {info?.info?.country}
                </Typography>
              )}
              {info?.info?.age && (
                <Typography>
                  <b>Age rating:</b> {info?.info?.age}
                </Typography>
              )}
              <MediaSpecs
                container={vod.container_extension}
                video={info?.info?.video}
                audio={info?.info?.audio}
                durationSecs={info?.info?.duration_secs}
                duration={info?.info?.duration}
                showDuration={!info?.info?.duration}
              />
            </>
          )}
          {state === "error" && (
            <Typography variant="body1" sx={{ mb: 1 }}>
              There was an error loading information for that title
            </Typography>
          )}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
            <Button
              variant="contained"
              color="inherit"
              onClick={() => setTrailerVisible((prev) => !prev)}
              disabled={!info || !info.info?.youtube_trailer}
            >
              Watch Trailer
            </Button>
            <Button variant="contained" color="primary" onClick={toggleWatchlist}>
              {watchlist.find(
                (element) =>
                  element.id === vod.stream_id && element.type === "vod",
              )
                ? "Remove from Watchlist"
                : "Add to Watchlist"}
            </Button>
            {playButton !== undefined && playButton}
            <Button
              variant="contained"
              color="inherit"
              onClick={() => onClickCopy()}
            >
              Copy Video Url
            </Button>
            {isVlcPlatform() && (
              <Button
                variant="contained"
                color="inherit"
                startIcon={<OpenInNewRoundedIcon />}
                onClick={() => openInVlc(url)}
              >
                Open in VLC
              </Button>
            )}
          </Box>
        </div>
      </Grid>
    </Grid>
  )
}
