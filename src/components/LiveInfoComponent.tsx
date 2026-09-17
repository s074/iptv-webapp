import { FC } from "react"
import { LiveStream } from "../services/XtremeCodesAPI.types"
import Button from "@mui/material/Button"
import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded"
import { addToFavorites, removeFromFavorites, selectFavorites } from "../store/live/liveSlice"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { copyTextToClibpboard, isVlcPlatform, openInVlc } from "../services/utils"
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
      spacing={2}
      sx={{
        flexGrow: 1,
        justifyContent: "center",
        marginTop: 1,
      }}
    >
      <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
        <div style={{ justifyContent: "center" }}>
          <ShortEpgComponent
            stream={stream}
            onStreamClick={() => {}}
            hideChannelInfo
          />
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
            <Button variant="contained" color="primary" onClick={toggleWatchlist}>
              {favorites.find(
                (element) =>
                  element.stream_id === stream.stream_id,
              )
                ? "Remove from Favorites"
                : "Add to Favorites"}
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
