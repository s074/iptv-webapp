import { FC } from "react"
import { LiveStream } from "../services/XtremeCodesAPI.types"
import { Button, ButtonGroup, Grid } from "@mui/joy"
import { addToFavorites, removeFromFavorites } from "../store/app/appSlice"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { selectFavorites } from "../store/app/selector"
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
      columns={12}
      sx={{
        flexGrow: 1,
        justifyContent: "center",
        marginTop: 5,
      }}
    >
      <Grid xs={12} sm={12} md={12}>
        <div style={{ justifyContent: "center" }}>
          <ShortEpgComponent
            stream={stream}
            onStreamClick={() => {}}
          />
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
