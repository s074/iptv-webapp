import { FC, useRef } from "react"
import {
  Category,
  SeriesStream,
  VodStream,
} from "../services/XtremeCodesAPI.types"
import { useVirtualizer } from "@tanstack/react-virtual"
import { MediaCarousel } from "./MediaCarousel"
import Typography from "@mui/material/Typography"

export interface MediaVirtualizedListProps {
  categories: Category[]
  streams: (SeriesStream | VodStream)[]
  onStreamClick: (stream: SeriesStream | VodStream) => void
}

export const MediaVirtualizedList: FC<MediaVirtualizedListProps> = (props) => {
  const parentRef = useRef<HTMLDivElement>(null)
  const { categories, streams, onStreamClick } = props

  const rowVirtualizer = useVirtualizer({
    count: categories.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 350,
    overscan: 5,
  })

  return (
    <div
      ref={parentRef}
      style={{
        height: "100%",
        overflow: "auto",
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const category = categories[virtualItem.index]
          return (
            <div
              key={virtualItem.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: `${virtualItem.size}px`,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <Typography variant="h6" align="center">
                {category.category_name}
              </Typography>
              <MediaCarousel
                items={streams.filter(
                  (stream) => stream.category_id === category.category_id,
                )}
                onStreamClick={onStreamClick}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
