import { Typography } from "@mui/joy"
import { FC, useCallback, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { MediaCarousel } from "../components/MediaCarousel"
import { useAppSelector } from "../store/hooks"
import {
  selectLiveStreams,
  selectSeriesStreams,
  selectVodStreams,
} from "../store/app/selector"
import {
  LiveStream,
  SeriesStream,
  VodStream,
} from "../services/XtremeCodesAPI.types"
import { MediaInfoModal } from "../components/MediaInfoModal"

export const SearchResults: FC = () => {
  const [searchParams] = useSearchParams()
  const seriesStreams = useAppSelector(selectSeriesStreams)
  const vodStreams = useAppSelector(selectVodStreams)
  const liveStreams = useAppSelector(selectLiveStreams)
  const [selectedTitle, setSelectedTitle] = useState<
    (VodStream | SeriesStream | LiveStream) | undefined
  >(undefined)

  const query = searchParams.get("query")

  const onStreamClick = (stream: VodStream | SeriesStream | LiveStream) => {
    setSelectedTitle(stream)
  }

  const filteredSeries = useCallback(() => {
    if (!query) return []

    return seriesStreams.filter((stream) =>
      stream.name?.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
    )
  }, [query, seriesStreams])

  const filteredMovies = useCallback(() => {
    if (!query) return []

    return vodStreams.filter((stream) =>
      stream.name?.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
    )
  }, [query, vodStreams])

  const filteredChannels = useCallback(() => {
    if (!query) return []

    return liveStreams.filter((stream) =>
      stream.name?.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
    )
  }, [liveStreams, query])

  return (
    <>
      {selectedTitle && (
        <MediaInfoModal
          onClose={() => setSelectedTitle(undefined)}
          stream={selectedTitle}
        />
      )}
      <div style={{ overflow: "auto", paddingBottom: 50, height: "100%" }}>
        {query && (
          <>
            <div style={{ height: 315, marginBottom: 5 }}>
              <Typography
                level="title-lg"
                justifyContent="center"
                display="flex"
              >
                Movies
              </Typography>
              {filteredMovies().length > 0 ? (
                <MediaCarousel
                  items={filteredMovies()}
                  onStreamClick={onStreamClick}
                  key={query}
                />
              ) : (
                <Typography>No results</Typography>
              )}
            </div>
            <div style={{ height: 315, marginBottom: 5 }}>
              <Typography
                level="title-lg"
                justifyContent="center"
                display="flex"
              >
                Series
              </Typography>
              {filteredSeries().length > 0 ? (
                <MediaCarousel
                  items={filteredSeries()}
                  onStreamClick={onStreamClick}
                  key={query}
                />
              ) : (
                <Typography>No results</Typography>
              )}
            </div>
            <div style={{ height: 315 }}>
              <Typography
                level="title-lg"
                justifyContent="center"
                display="flex"
              >
                Channels
              </Typography>
              {filteredChannels().length > 0 ? (
                <MediaCarousel
                  items={filteredChannels()}
                  onStreamClick={onStreamClick}
                  key={query}
                />
              ) : (
                <Typography>No results</Typography>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
