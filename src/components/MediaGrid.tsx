import { forwardRef, memo, type Key, type ReactNode } from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { VirtuosoGrid, type VirtuosoGridHandle } from "react-virtuoso"
import { useRef } from "react"
import { thinScrollbarSx } from "./scrollbar"

const GridScroller = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => (
  <Box
    ref={ref}
    {...props}
    sx={{
      overflowY: "auto",
      overflowX: "hidden",
      height: "100%",
      ...thinScrollbarSx,
      ...((props as { sx?: object }).sx ?? {}),
    }}
  />
))
GridScroller.displayName = "MediaGridScroller"

const GridList = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => (
  <Box
    ref={ref}
    {...props}
    sx={{
      display: "grid",
      gridTemplateColumns: {
        // ~3 posters per row on phones, scaling up on larger screens
        xs: "repeat(auto-fill, minmax(96px, 1fr))",
        sm: "repeat(auto-fill, minmax(150px, 1fr))",
        md: "repeat(auto-fill, minmax(170px, 1fr))",
      },
      gap: { xs: 1.25, sm: 2 },
      p: { xs: 1.25, sm: 2 },
    }}
  />
))
GridList.displayName = "MediaGridList"

const GridItem = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => (
  <Box
    ref={ref}
    {...props}
    sx={{ display: "flex", minWidth: 0 }}
  />
))
GridItem.displayName = "MediaGridItem"

export interface MediaGridProps<T> {
  items: T[]
  itemKey: (item: T, index: number) => Key
  renderCard: (item: T, index: number) => ReactNode
  emptyTitle?: string
  emptyHint?: string
}

function MediaGridInner<T>({
  items,
  itemKey,
  renderCard,
  emptyTitle = "Nothing here",
  emptyHint = "Try a different category or search.",
}: MediaGridProps<T>) {
  const virtuosoRef = useRef<VirtuosoGridHandle>(null)

  if (items.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          p: 6,
          textAlign: "center",
        }}
      >
        <Typography variant="h6" color="text.primary">
          {emptyTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {emptyHint}
        </Typography>
      </Box>
    )
  }

  return (
    <VirtuosoGrid
      ref={virtuosoRef}
      data={items}
      totalCount={items.length}
      computeItemKey={(index) => itemKey(items[index], index)}
      itemContent={(index) => renderCard(items[index], index)}
      components={{
        Scroller: GridScroller,
        List: GridList,
        Item: GridItem,
      }}
      style={{ height: "100%" }}
    />
  )
}

export const MediaGrid = memo(MediaGridInner) as typeof MediaGridInner
