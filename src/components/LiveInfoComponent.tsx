import { FC } from "react"
import { LiveStream } from "../services/XtremeCodesAPI.types"
import Button from "@mui/material/Button"
import ButtonGroup from "@mui/material/ButtonGroup"
import Grid from "@mui/material/Grid"
import { addToFavorites, removeFromFavorites, selectFavorites } from "../store/live/liveSlice"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { copyTextToClibpboard } from "../services/utils"
import { useChannelUrl } from "./useMediaUrl"
import { ShortEpgComponent } from "./ShortEpgComponent"

export interface LiveInfoProps {
  stream: LiveStream
  playButton?: JSX.Element
}

export const LiveInfoComponent: FC<LiveInfoProps> = (props) => {
  const { stream, playButton } = props
  const favorites = useAppSelector(selectFavorites)
  const dispatch = useAppDispatch()
  const url = useChannelUrl(stream?.stream_id ?? 0, "m3u8")

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
      sx={{
        flexGrow: 1,
        justifyContent: "center",
        marginTop: 5,
      }}
    >
      <Grid size={{ xs: 12 }}>
        <div style={{ justifyContent: "center" }}>
          <ShortEpgComponent
            stream={stream}
            onStreamClick={() => {}}
          />
          <ButtonGroup sx={{ margin: 5 }} variant="contained">
            <Button color="primary" onClick={toggleWatchlist}>
              {favorites.find(
                (element) =>
                  element.stream_id === stream.stream_id,
              )
                ? "Remove from Favorites"
                : "Add to Favorites"}
            </Button>
            {playButton !== undefined && playButton}
            <Button
              color="inherit"
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
