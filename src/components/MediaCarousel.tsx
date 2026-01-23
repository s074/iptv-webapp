import { FC, useCallback, useMemo, useState } from "react"
import {
  LiveStream,
  SeriesStream,
  VodStream,
} from "../services/XtremeCodesAPI.types"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import useMediaQuery from "@mui/material/useMediaQuery"
import { useTheme } from "@mui/material/styles"
import { Box, IconButton } from "@mui/joy"
import { MediaCard } from "./MediaCard"
import { isLive, isSeries } from "../services/utils"
import { ChannelCard } from "./ChannelCard"

export interface MediaCarouselProps {
  items: (VodStream | SeriesStream | LiveStream)[]
  onStreamClick: (stream: VodStream | SeriesStream | LiveStream) => void
}

export const MediaCarousel: FC<MediaCarouselProps> = (props) => {
  const { items, onStreamClick } = props
  const [currentPage, setCurrentPage] = useState(0)
  const theme = useTheme()
  const isSmScreen = useMediaQuery(theme.breakpoints.up("sm"))
  const ismdScreen = useMediaQuery(theme.breakpoints.up("md"))
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"))
  const isXtraLargeScreen = useMediaQuery(theme.breakpoints.up("xl"))

  const pageSize = useCallback(() => {
    if (isXtraLargeScreen) return 5
    if (isLargeScreen) return 4
    if (ismdScreen) return 3
    if (isSmScreen) return 2
    return 1
  }, [isLargeScreen, isSmScreen, isXtraLargeScreen, ismdScreen])

  const pageItems = useMemo(
    () =>
      items.slice(
        currentPage * pageSize(),
        currentPage * pageSize() + pageSize(),
      ),
    [currentPage, items, pageSize],
  )

  const handleClickPrev = () => {
    if (currentPage === 0) return

    setCurrentPage((prev) => prev - 1)
  }

  const handleClickNext = () => {
    const lastElementIndex = currentPage * pageSize() + pageSize()

    if (lastElementIndex >= items.length - 1) return

    setCurrentPage((prev) => prev + 1)
  }

  const hasNext = currentPage * pageSize() + pageSize() < items.length - 1

  const hasPrev = currentPage > 0

  return (
    <div
      style={{
        display: "flex",
        flexGrow: 1,
        flexWrap: "nowrap",
        height: "90%",
        marginBottom: 5,
      }}
    >
      <IconButton
        variant="outlined"
        size="sm"
        onClick={handleClickPrev}
        sx={{
          marginY: 5,
          marginX: 0,
          display: "inline-flex",
          width: "auto",
          flexGrow: 0,
        }}
        disabled={!hasPrev}
      >
        <ArrowBackIcon />
      </IconButton>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xl: "1fr 1fr 1fr 1fr 1fr",
            lg: "1fr 1fr 1fr 1fr",
            md: "1fr 1fr 1fr",
            sm: "minmax(100px, 1fr) minmax(100px, 1fr)",
            xs: "minmax(100px, 1fr)",
          },
          gridTemplateRows: "1fr",
          flexGrow: 1,
          columnGap: 5,
          rowGap: 5,
          wrap: "nowrap",
          width: "100%",
        }}
      >
        {pageItems.map((item) => {
          if (isLive(item))
            return (
              <ChannelCard
                stream={item}
                onStreamClick={onStreamClick}
                key={item.stream_id}
              />
            )
          else
            return (
              <MediaCard
                onStreamClick={onStreamClick}
                stream={item}
                key={isSeries(item) ? item.series_id : item.stream_id}
              />
            )
        })}
      </Box>
      <IconButton
        variant="outlined"
        size="sm"
        onClick={handleClickNext}
        sx={{ marginY: 5, display: "inline-flex" }}
        disabled={!hasNext}
      >
        <ArrowForwardIcon />
      </IconButton>
    </div>
  )
}
