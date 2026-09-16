import { FC, useState } from "react"
import {
  LiveStream,
  SeriesEpisode,
  SeriesStream,
  VodStream,
} from "../services/XtremeCodesAPI.types"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import IconButton from "@mui/material/IconButton"
import CloseIcon from "@mui/icons-material/Close"
import { VodInfoComponent } from "./VodInfoComponent"
import { isLive, isSeries, isVod } from "../services/utils"
import { SeriesInfoComponent } from "./SeriesInfoComponent"
import { useNavigate } from "react-router-dom"
import { urls } from "../services/urls"
import queryString from "query-string"
import { LiveInfoComponent } from "./LiveInfoComponent"

export interface MediaInfoModalProps {
  onClose: () => void
  stream: VodStream | SeriesStream | LiveStream
}

export const MediaInfoModal: FC<MediaInfoModalProps> = (props) => {
  const { onClose, stream } = props
  const navigate = useNavigate()
  const [selectedEpisode, setSelectedEpisode] = useState<
    SeriesEpisode | undefined
  >(undefined) // for series only

  const onClickWatch = () => {
    if (isVod(stream)) {
      if (stream.stream_id === undefined) return

      navigate(urls.movieWatch.replace(":id", stream.stream_id.toString()))
    } else if (isSeries(stream)) {
      if (stream.series_id === undefined) return

      navigate(urls.seriesWatch.replace(":id", stream.series_id.toString()))
    } else {
      if (stream.stream_id === undefined) return

      navigate({
        pathname: urls.liveTv,
        search: queryString.stringify({ channel: stream.stream_id }),
      })
    }
  }

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        {stream?.name}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ minWidth: 300 }}>
          {isVod(stream) && (
            <VodInfoComponent
              vod={stream}
              playButton={
                <Button variant="contained" color="success" onClick={onClickWatch}>
                  Play
                </Button>
              }
            />
          )}
          {isSeries(stream) && (
            <SeriesInfoComponent
              series={stream}
              playButton={
                <Button variant="contained" color="success" onClick={onClickWatch}>
                  Play
                </Button>
              }
              selectedEpisode={selectedEpisode}
              onSelectEpisode={(episode) => setSelectedEpisode(episode)}
            />
          )}
          {isLive(stream) && (
            <LiveInfoComponent
              stream={stream}
              playButton={
                <Button variant="contained" color="success" onClick={onClickWatch}>
                  Play
                </Button>
              }
            />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  )
}
