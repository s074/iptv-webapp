import { FC, useMemo, useState } from "react"
import { selectVodCategories, selectVodStreams } from "../store/vod/vodSlice"
import { useAppSelector } from "../store/hooks"
import { VodStream } from "../services/XtremeCodesAPI.types"
import { MediaInfoModal } from "../components/MediaInfoModal"
import { MediaCard } from "../components/MediaCard"
import { CategoryBrowser } from "../components/CategoryBrowser"

export const Movies: FC = () => {
  const vodCategories = useAppSelector(selectVodCategories)
  const vodStreams = useAppSelector(selectVodStreams)
  const [currentMovie, setCurrentMovie] = useState<VodStream | undefined>(
    undefined,
  )

  const categories = useMemo(
    () =>
      vodCategories.map((c) => ({
        id: String(c.category_id),
        name: c.category_name ?? "Unknown",
      })),
    [vodCategories],
  )

  return (
    <>
      {currentMovie && (
        <MediaInfoModal
          onClose={() => setCurrentMovie(undefined)}
          stream={currentMovie}
        />
      )}
      <CategoryBrowser<VodStream>
        categories={categories}
        items={vodStreams}
        getCategoryId={(s) =>
          s.category_id !== undefined ? String(s.category_id) : undefined
        }
        getItemKey={(s) => s.stream_id ?? s.name ?? Math.random()}
        renderCard={(movie) => (
          <MediaCard onStreamClick={setCurrentMovie} stream={movie} />
        )}
        selectedCategoryId={undefined}
        onSelectCategory={() => {}}
      />
    </>
  )
}
