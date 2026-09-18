import { FC, useMemo, useState } from "react"
import { SeriesStream } from "../services/XtremeCodesAPI.types"
import { useAppSelector } from "../store/hooks"
import {
  selectSeriesCategories,
  selectSeriesStreams,
} from "../store/series/seriesSlice"
import { MediaInfoModal } from "../components/MediaInfoModal"
import { MediaCard } from "../components/MediaCard"
import { CategoryBrowser } from "../components/CategoryBrowser"
import { selectHiddenSeries } from "../store/hiddenCategories/hiddenCategoriesSlice"

export const TVSeries: FC = () => {
  const seriesStreams = useAppSelector(selectSeriesStreams)
  const seriesCategories = useAppSelector(selectSeriesCategories)
  const hiddenSeries = useAppSelector(selectHiddenSeries)
  const [currentSeries, setCurrentSeries] = useState<SeriesStream | undefined>(
    undefined,
  )

  const categories = useMemo(
    () =>
      seriesCategories
        .map((c) => ({
          id: String(c.category_id),
          name: c.category_name ?? "Unknown",
        }))
        .filter((c) => !hiddenSeries.includes(c.id)),
    [seriesCategories, hiddenSeries],
  )

  return (
    <>
      {currentSeries && (
        <MediaInfoModal
          onClose={() => setCurrentSeries(undefined)}
          stream={currentSeries}
        />
      )}
      <CategoryBrowser<SeriesStream>
        categories={categories}
        items={seriesStreams}
        getCategoryId={(s) =>
          s.category_id !== undefined ? String(s.category_id) : undefined
        }
        getItemKey={(s) => s.series_id ?? s.name ?? Math.random()}
        renderCard={(series) => (
          <MediaCard onStreamClick={setCurrentSeries} stream={series} />
        )}
        selectedCategoryId={undefined}
        onSelectCategory={() => {}}
      />
    </>
  )
}
