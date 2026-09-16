import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { FC, useMemo, useState } from "react"
import { useAppSelector } from "../store/hooks"
import {
  selectSeriesStreams,
} from "../store/series/seriesSlice"
import { SeriesStream, VodStream } from "../services/XtremeCodesAPI.types"
import { MediaInfoModal } from "../components/MediaInfoModal"
import { MediaCard } from "../components/MediaCard"
import { MediaGrid } from "../components/MediaGrid"
import { selectWatchlist } from "../store/watchlist/watchlistSlice"
import { selectVodStreams } from "../store/vod/vodSlice"

type WatchItem = VodStream | SeriesStream

function isSeriesItem(item: WatchItem): item is SeriesStream {
  return (item as SeriesStream).series_id !== undefined
}

export const Watchlist: FC = () => {
  const watchlist = useAppSelector(selectWatchlist)
  const vodStreams = useAppSelector(selectVodStreams)
  const seriesStreams = useAppSelector(selectSeriesStreams)
  const [selectedStream, setSelectedStream] = useState<WatchItem | undefined>(
    undefined,
  )

  const watchlistItems = useMemo(() => {
    const items: WatchItem[] = []

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
      <Box sx={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, px: 2.5, py: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Watchlist
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {watchlistItems.length} titles
          </Typography>
        </Box>
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <MediaGrid<WatchItem>
            items={watchlistItems}
            itemKey={(item) =>
              isSeriesItem(item)
                ? (item.series_id ?? item.name ?? Math.random())
                : (item.stream_id ?? item.name ?? Math.random())
            }
            renderCard={(item) => (
              <MediaCard onStreamClick={setSelectedStream} stream={item} />
            )}
            emptyTitle="Watchlist is empty"
            emptyHint="Add movies or series from their info dialog."
          />
        </Box>
      </Box>
    </>
  )
}
