import { FC, useMemo } from "react";
import { useAppSelector } from "../store/hooks";
import { selectBulkEpg, selectExternalEpg } from "../store/live/liveSlice";
import { LiveStream, LiveStreamEPGItem } from "../services/XtremeCodesAPI.types";
import { ChannelEpgComponent } from "./ChannelEpgComponent";

interface ShortEpgProps {
    stream: LiveStream,
    onStreamClick: (stream: LiveStream) => void,
    selected?: boolean
    hideChannelInfo?: boolean
}

// Guide data comes from bulk downloads, never per-stream requests: the
// provider XMLTV snapshot first, session external guides appended. Entries
// dedupe on (start, title) so overlapping sources don't double rows.
export const ShortEpgComponent: FC<ShortEpgProps> = (props) => {
    const { stream, onStreamClick, selected, hideChannelInfo = false } = props
    const bulkEpg = useAppSelector(selectBulkEpg)
    const externalEpg = useAppSelector(selectExternalEpg)

    const listings = useMemo(() => {
      if (!stream.epg_channel_id) return undefined
      const seen = new Set<string>()
      const merged: LiveStreamEPGItem[] = []
      const collect = (list: LiveStreamEPGItem[] | undefined) => {
        for (const item of list ?? []) {
          const key = `${item.start_timestamp ?? ""}|${item.title ?? ""}`
          if (seen.has(key)) continue
          seen.add(key)
          merged.push(item)
        }
      }
      collect(bulkEpg[stream.epg_channel_id])
      for (const byChannel of Object.values(externalEpg)) {
        collect(byChannel[stream.epg_channel_id])
      }
      if (merged.length === 0) return undefined
      return [...merged].sort(
        (a, b) => (Number(a.start_timestamp) || 0) - (Number(b.start_timestamp) || 0),
      )
    }, [bulkEpg, externalEpg, stream.epg_channel_id])

    const epg = listings?.length ? { epg_listings: listings } : undefined

    return (
        <ChannelEpgComponent epg={epg} offset={0} stream={stream} onStreamClick={(stream) => onStreamClick(stream) } selected={selected } hideChannelInfo={hideChannelInfo} />
    )
}
