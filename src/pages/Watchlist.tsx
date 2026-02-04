import { Box, Grid } from "@mui/joy"
import { FC, useCallback, useState } from "react"
import { useAppSelector } from "../store/hooks"
import {
  selectSeriesStreams,
} from "../store/series/seriesSlice"
import { SeriesStream, VodStream } from "../services/XtremeCodesAPI.types"
import { MediaInfoModal } from "../components/MediaInfoModal"
import { MediaCard } from "../components/MediaCard"
import { selectWatchlist } from "../store/watchlist/watchlistSlice"
import { selectVodStreams } from "../store/vod/vodSlice"

export const Watchlist: FC = () => {
  const watchlist = useAppSelector(selectWatchlist)
  const vodStreams = useAppSelector(selectVodStreams)
  const seriesStreams = useAppSelector(selectSeriesStreams)
  const [selectedStream, setSelectedStream] = useState<
    (VodStream | SeriesStream) | undefined
  >(undefined)

  const watchlistItems = useCallback(() => {
    const items: (VodStream | SeriesStream)[] = []

    for (const item of watchlist) {
      if (item.type === "vod") {
        const vod = vodStreams.find((element) => element.stream_id === item.id)
        if (vod) items.push(vod)
      } else {
        const series = seriesStreams.find(
          (element) => element.series_id === item.id,
        )
        if (series) items.push(series)
      }
    }

    return items
  }, [seriesStreams, vodStreams, watchlist])

  return (
    <>
      {selectedStream && (
        <MediaInfoModal
          onClose={() => setSelectedStream(undefined)}
          stream={selectedStream}
        />
      )}
      <Box sx={{ flexGrow: 1, height: "100%", paddingBottom: 5 }}>
        <Grid container spacing={2} sx={{ justifyContent: "flex-start" }}>
          {watchlistItems().map((item, index) => (
            <Grid
              xs={12}
              sm={6}
              md={4}
              lg={3}
              xl={2}
              key={index}
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight={300}
            >
              <MediaCard onStreamClick={setSelectedStream} stream={item} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </>
  )
}
