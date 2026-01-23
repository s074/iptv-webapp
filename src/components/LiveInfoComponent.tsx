import { FC, useEffect, useState } from "react"
import { LiveStream, LiveStreamEPG } from "../services/XtremeCodesAPI.types"
import { Loading } from "./layout/Loading"
import { Button, ButtonGroup, Grid, Typography } from "@mui/joy"
import { addToFavorites, addToWatchlist, removeFromFavorites, removeFromWatchlist } from "../store/app/appSlice"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { selectFavorites } from "../store/app/selector"
import { copyTextToClibpboard } from "../services/utils"
import { useChannelUrl } from "./useMediaUrl"
import { fetchShortEpg } from "../store/app/thunks"
import { ChannelEpgComponent } from "./ChannelEpgComponent"

export interface LiveInfoProps {
  stream: LiveStream
  playButton?: JSX.Element
}

export const LiveInfoComponent: FC<LiveInfoProps> = (props) => {
  const { stream, playButton } = props
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")
  const [epg, setEpg] = useState<LiveStreamEPG | undefined>(undefined)
  const favorites = useAppSelector(selectFavorites)
  const dispatch = useAppDispatch()
  const url = useChannelUrl(stream?.stream_id ?? 0, "m3u8")

  useEffect(() => {
    if (!stream || !stream.stream_id) return

    dispatch(fetchShortEpg({ channelId: stream.stream_id, limit: 5 }))
      .unwrap()
      .then((info) => {
        setEpg(info)
        setState("ready")
      })
      .catch((e) => {
        console.log(e)
        setState("error")
      })
  }, [dispatch, stream])

  if (state === "loading") return <Loading />

  const toggleWatchlist = () => {
    if (stream.stream_id === undefined) return

    if (
      favorites.find(
        (element) => element.stream_id === stream.stream_id,
      )
    ) {
      dispatch(removeFromFavorites(stream))
    } else {
      dispatch(addToFavorites(stream))
    }
  }

  const onClickCopy = async () => {
    await copyTextToClibpboard(url)
  }

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
      <Grid xs={12} sm={12} md={12}>
        <div style={{ justifyContent: "center" }}>
          {state === "ready" && epg && (
            <ChannelEpgComponent
              epg={epg}
              offset={0}
              stream={stream}
              onStreamClick={() => {}}
            />
          )}
          {state === "error" && (
            <Typography level="body-lg" marginBottom={1}>
              There was an error loading information for that title
            </Typography>
          )}
          <ButtonGroup sx={{ margin: 5 }} spacing="0.5rem">
            <Button variant="solid" color="primary" onClick={toggleWatchlist}>
              {favorites.find(
                (element) =>
                  element.stream_id === stream.stream_id,
              )
                ? "Remove from Favorites"
                : "Add to Favorites"}
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
