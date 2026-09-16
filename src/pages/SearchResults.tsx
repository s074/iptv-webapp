import Box from "@mui/material/Box"
import Tabs from "@mui/material/Tabs"
import Tab from "@mui/material/Tab"
import Chip from "@mui/material/Chip"
import Typography from "@mui/material/Typography"
import { FC, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useAppSelector } from "../store/hooks"
import {
  selectLiveStreams,
} from "../store/live/liveSlice"
import {
  LiveStream,
  SeriesStream,
  VodStream,
} from "../services/XtremeCodesAPI.types"
import { MediaInfoModal } from "../components/MediaInfoModal"
import { MediaCard } from "../components/MediaCard"
import { ChannelCard } from "../components/ChannelCard"
import { MediaGrid } from "../components/MediaGrid"
import { selectSeriesStreams } from "../store/series/seriesSlice"
import { selectVodStreams } from "../store/vod/vodSlice"

type SearchTab = "movies" | "series" | "channels"

function TabLabel({ title, count }: { title: string; count: number }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {title}
      <Chip
        size="small"
        label={count}
        color="primary"
        variant={count > 0 ? "filled" : "outlined"}
        sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }}
      />
    </Box>
  )
}

export const SearchResults: FC = () => {
  const [searchParams] = useSearchParams()
  const seriesStreams = useAppSelector(selectSeriesStreams)
  const vodStreams = useAppSelector(selectVodStreams)
  const liveStreams = useAppSelector(selectLiveStreams)
  const [selectedTitle, setSelectedTitle] = useState<
    (VodStream | SeriesStream | LiveStream) | undefined
  >(undefined)
  const [activeTab, setActiveTab] = useState<SearchTab>("movies")

  const query = searchParams.get("query") ?? ""

  const onStreamClick = (stream: VodStream | SeriesStream | LiveStream) => {
    setSelectedTitle(stream)
  }

  const filteredMovies = useMemo(() => {
    if (!query) return []
    return vodStreams.filter((stream) =>
      stream.name?.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
    )
  }, [query, vodStreams])

  const filteredSeries = useMemo(() => {
    if (!query) return []
    return seriesStreams.filter((stream) =>
      stream.name?.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
    )
  }, [query, seriesStreams])

  const filteredChannels = useMemo(() => {
    if (!query) return []
    return liveStreams.filter((stream) =>
      stream.name?.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
    )
  }, [liveStreams, query])

  // Jump to the first tab with results whenever the query changes
  useEffect(() => {
    if (filteredMovies.length > 0) setActiveTab("movies")
    else if (filteredSeries.length > 0) setActiveTab("series")
    else if (filteredChannels.length > 0) setActiveTab("channels")
    else setActiveTab("movies")
  }, [query, filteredMovies.length, filteredSeries.length, filteredChannels.length])

  return (
    <>
      {selectedTitle && (
        <MediaInfoModal
          onClose={() => setSelectedTitle(undefined)}
          stream={selectedTitle}
        />
      )}
      <Box sx={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>
        {!query ? (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            Type something in the search box above.
          </Typography>
        ) : (
          <>
            <Box sx={{ borderBottom: "1px solid", borderColor: "divider", px: 1, flexShrink: 0 }}>
              <Tabs
                value={activeTab}
                onChange={(_, next: SearchTab) => setActiveTab(next)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab
                  value="movies"
                  label={<TabLabel title="Movies" count={filteredMovies.length} />}
                />
                <Tab
                  value="series"
                  label={<TabLabel title="Series" count={filteredSeries.length} />}
                />
                <Tab
                  value="channels"
                  label={<TabLabel title="Channels" count={filteredChannels.length} />}
                />
              </Tabs>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              {activeTab === "movies" && (
                <MediaGrid<VodStream>
                  items={filteredMovies}
                  itemKey={(s) => s.stream_id ?? s.name ?? Math.random()}
                  renderCard={(movie) => (
                    <MediaCard onStreamClick={onStreamClick} stream={movie} />
                  )}
                  emptyTitle="No movies"
                  emptyHint={`Nothing matched "${query}".`}
                />
              )}
              {activeTab === "series" && (
                <MediaGrid<SeriesStream>
                  items={filteredSeries}
                  itemKey={(s) => s.series_id ?? s.name ?? Math.random()}
                  renderCard={(series) => (
                    <MediaCard onStreamClick={onStreamClick} stream={series} />
                  )}
                  emptyTitle="No series"
                  emptyHint={`Nothing matched "${query}".`}
                />
              )}
              {activeTab === "channels" && (
                <MediaGrid<LiveStream>
                  items={filteredChannels}
                  itemKey={(s) => s.stream_id ?? s.name ?? Math.random()}
                  renderCard={(ch) => (
                    <ChannelCard onStreamClick={onStreamClick} stream={ch} />
                  )}
                  emptyTitle="No channels"
                  emptyHint={`Nothing matched "${query}".`}
                />
              )}
            </Box>
          </>
        )}
      </Box>
    </>
  )
}
