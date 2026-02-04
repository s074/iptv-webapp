import { FC, useState } from "react"
import { selectVodCategories, selectVodStreams } from "../store/vod/vodSlice"
import { useAppSelector } from "../store/hooks"
import { VodStream } from "../services/XtremeCodesAPI.types"
import { MediaInfoModal } from "../components/MediaInfoModal"
import { MediaVirtualizedList } from "../components/MediaVirtualizedList"

export const Movies: FC = () => {
  const vodCategories = useAppSelector(selectVodCategories)
  const vodStreams = useAppSelector(selectVodStreams)
  const [currentMovie, setCurrentMovie] = useState<VodStream | undefined>(
    undefined,
  )

  const onMovieClick = (movie: VodStream) => {
    console.log(movie)
    setCurrentMovie(movie)
  }

  return (
    <>
      {currentMovie && (
        <MediaInfoModal
          onClose={() => setCurrentMovie(undefined)}
          stream={currentMovie}
        />
      )}
      <MediaVirtualizedList
        categories={vodCategories}
        streams={vodStreams}
        onStreamClick={onMovieClick}
      />
    </>
  )
}
