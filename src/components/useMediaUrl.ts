import {
  selectAccountInfo,
  selectPreferredBaseUrl,
} from "../store/app/selector"
import { selectLiveStreams } from "../store/live/liveSlice"
import { useAppSelector } from "../store/hooks"

export function useVodUrl(vodId: number, extension: string) {
  const accountInfo = useAppSelector(selectAccountInfo)
  const baseUrl = useAppSelector(selectPreferredBaseUrl)

  return `${baseUrl}/movie/${accountInfo.user_info?.username}/${accountInfo.user_info?.password}/${vodId}.${extension}`
}

export function useEpisodeUrl(episodeStreamId: number, extension: string) {
  const accountInfo = useAppSelector(selectAccountInfo)
  const baseUrl = useAppSelector(selectPreferredBaseUrl)

  return `${baseUrl}/series/${accountInfo.user_info?.username}/${accountInfo.user_info?.password}/${episodeStreamId}.${extension}`
}

export function useChannelUrl(channelId: number, format: string) {
  const liveStreams = useAppSelector(selectLiveStreams)
  const accountInfo = useAppSelector(selectAccountInfo)
  const baseUrl = useAppSelector(selectPreferredBaseUrl)

  // M3U entries carry their playable URL directly — nothing to construct.
  const direct = liveStreams.find(
    (stream) => stream.stream_id === channelId,
  )?.direct_source
  if (direct) return direct

  return `${baseUrl}/live/${accountInfo.user_info?.username}/${accountInfo.user_info?.password}/${channelId}.${format}`
}
