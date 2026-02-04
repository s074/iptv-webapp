import { FC, useEffect, useState } from "react"
import { VodInfo, VodStream } from "../services/XtremeCodesAPI.types"
import { AspectRatio, Button, ButtonGroup, Grid, Typography } from "@mui/joy"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { fetchVodInfoAsync } from "../store/vod/vodSlice"
import { YoutubeVideo } from "./YoutubeVideo"
import { Loading } from "./layout/Loading"
import { selectWatchlist, addToWatchlist, removeFromWatchlist } from "../store/watchlist/watchlistSlice"
import { useVodUrl } from "./useMediaUrl"
import { copyTextToClibpboard } from "../services/utils"

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
      spacing={1}
      columns={12}
      sx={{
        flexGrow: 1,
        justifyContent: "center",
        marginTop: 5,
      }}
    >
      <Grid
        xs={12}
        sm={12}
        md={5}
        justifyContent="center"
        alignContent="center"
      >
        {showTrailer && <YoutubeVideo id={info?.info?.youtube_trailer ?? ""} />}
        {!showTrailer && (
          <AspectRatio objectFit="contain" variant="plain">
            <img src={vod.stream_icon} alt={""} />
          </AspectRatio>
        )}
      </Grid>
      <Grid xs={12} sm={12} md={7}>
        <div style={{ justifyContent: "center" }}>
          {state === "ready" && (
            <>
              <Typography level="body-lg" marginBottom={1}>
                {info?.info?.plot}
              </Typography>
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
            </>
          )}
          {state === "error" && (
            <Typography level="body-lg" marginBottom={1}>
              There was an error loading information for that title
            </Typography>
          )}
          <ButtonGroup sx={{ margin: 5 }} spacing="0.5rem">
            <Button
              variant="solid"
              color="neutral"
              onClick={() => setTrailerVisible((prev) => !prev)}
              disabled={!info || !info.info?.youtube_trailer}
            >
              Watch Trailer
            </Button>
            <Button variant="solid" color="primary" onClick={toggleWatchlist}>
              {watchlist.find(
                (element) =>
                  element.id === vod.stream_id && element.type === "vod",
              )
                ? "Remove from Watchlist"
                : "Add to Watchlist"}
            </Button>
            {playButton !== undefined && playButton}
            <Button
              variant="soft"
              color="neutral"
              onClick={() => onClickCopy()}
            >
              Copy Video Url
            </Button>
          </ButtonGroup>
        </div>
      </Grid>
    </Grid>
  )
}
