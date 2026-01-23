import { FC, useEffect, useState } from "react";
import { useAppDispatch } from "../store/hooks";
import { fetchShortEpg } from "../store/app/thunks";
import { LiveStream, LiveStreamEPG } from "../services/XtremeCodesAPI.types";
import { ChannelEpgComponent } from "./ChannelEpgComponent";

interface ShortEpgProps {
    stream: LiveStream,
    limit?: number,
    onStreamClick: (stream: LiveStream) => void,
    selected?: boolean
}
export const ShortEpgComponent: FC<ShortEpgProps> = (props) => {
    const { stream, limit, onStreamClick, selected } = props
    const dispatch = useAppDispatch()
    const [epg, setEpg] = useState<LiveStreamEPG | undefined>(undefined)
    
    useEffect(() => {
        const fetchData = async () => {
            try {
              const info = await dispatch(fetchShortEpg({ channelId: stream.stream_id!, limit: limit ?? 5 })).unwrap()
              setEpg(info)
            } catch (error) {
              console.log(error)
            }
        }
    
        fetchData()
      }, [stream, dispatch])

    return (
        <ChannelEpgComponent epg={epg} offset={0} stream={stream} onStreamClick={(stream) => onStreamClick(stream) } selected={selected } />
    )
}