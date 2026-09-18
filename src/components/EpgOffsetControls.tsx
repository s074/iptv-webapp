import { FC, useEffect, useMemo, useState } from "react"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Chip from "@mui/material/Chip"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useAppSelector } from "../store/hooks"
import { selectAppState, selectIsXtreamSource } from "../store/app/selector"
import {
  XTREAM_BULK_SOURCE_ID,
  extEpgSourceId,
  formatOffsetLabel,
  getTimeZoneOffsetMinutes,
  setEpgOffset,
  useEpgOffsets,
} from "../services/epgTime"
import { getExternalEpgUrls } from "../services/externalEpg"

const PRESET_MINUTES = [-180, -120, -60, -30, 0, 30, 60, 120, 180]
// DWTS listing from a real response, gives users a concrete preview.
const SAMPLE_EPOCH = 1789610400

function formatPreview(epochSeconds: number, offsetMinutes: number): string {
  return new Date((epochSeconds + offsetMinutes * 60) * 1000).toLocaleString(
    [],
    { weekday: "short", hour: "2-digit", minute: "2-digit" },
  )
}

interface OffsetSourceRowProps {
  sourceId: string
  title: string
  subtitle?: string
  serverSuggestion?: { label: string; suggestion: number }
}

const OffsetSourceRow: FC<OffsetSourceRowProps> = (props) => {
  const { sourceId, title, subtitle, serverSuggestion } = props
  const offsets = useEpgOffsets()
  const offset = offsets[sourceId] ?? 0
  const [custom, setCustom] = useState("")

  const applyCustom = (raw: string) => {
    setCustom(raw)
    if (raw.trim() === "") return
    const num = Number(raw)
    if (!Number.isFinite(num)) return
    setEpgOffset(sourceId, Math.max(-1439, Math.min(1439, Math.round(num))))
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={title}>
        {title}
        {offset !== 0 && ` · ${formatOffsetLabel(offset)}`}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }} title={subtitle}>
          {subtitle}
        </Typography>
      )}
      <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
        {PRESET_MINUTES.map((minutes) => (
          <Chip
            key={minutes}
            label={formatOffsetLabel(minutes)}
            color={offset === minutes ? "primary" : "default"}
            variant={offset === minutes ? "filled" : "outlined"}
            onClick={() => setEpgOffset(sourceId, minutes)}
            sx={{ fontWeight: 600 }}
          />
        ))}
      </Box>
      {serverSuggestion && serverSuggestion.suggestion !== offset && (
        <Box
          sx={{
            mt: 1.5,
            p: 1.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "primary.main",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {serverSuggestion.label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Listings look stamped in server time, apply{" "}
              {formatOffsetLabel(serverSuggestion.suggestion)}?
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={() => setEpgOffset(sourceId, serverSuggestion.suggestion)}
          >
            Apply {formatOffsetLabel(serverSuggestion.suggestion)}
          </Button>
        </Box>
      )}
      <TextField
        size="small"
        fullWidth
        type="number"
        label="Custom correction (minutes)"
        placeholder="e.g. -120"
        value={custom}
        onChange={(e) => applyCustom(e.target.value)}
        sx={{ mt: 1.5 }}
        slotProps={{ htmlInput: { step: 30, min: -1439, max: 1439 } }}
      />
      <Box
        sx={{
          mt: 1.5,
          p: 1.5,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "action.hover",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Preview, a 02:00 UTC listing will display as:
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {formatPreview(SAMPLE_EPOCH, offset)}
        </Typography>
      </Box>
    </Box>
  )
}

// Correction controls shared by the LiveTV dialog and the Settings page.
// One block per guide source actually present: the provider bulk feed in
// Xtream sessions, plus every configured external guide URL.
export const EpgOffsetControls: FC = () => {
  const isXtream = useAppSelector(selectIsXtreamSource)
  const { accountInfo } = useAppSelector(selectAppState)
  const [savedUrls, setSavedUrls] = useState<string[]>([])

  useEffect(() => {
    getExternalEpgUrls().then(setSavedUrls)
  }, [])

  const deviceTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  )

  const serverInfo = accountInfo.server_info
  const serverTimestamp = useMemo(() => {
    const raw = serverInfo?.timestamp_now
    if (raw === undefined) return undefined
    const num = Number(raw)
    return Number.isFinite(num) ? num : undefined
  }, [serverInfo?.timestamp_now])

  // If the panel stamps server-wall time as UTC, the bulk correction is
  // the negative of the server's UTC offset. Suggested, never auto-applied.
  const bulkSuggestion = useMemo(() => {
    if (!serverInfo?.timezone) return undefined
    const serverOffset = getTimeZoneOffsetMinutes(serverInfo.timezone)
    if (serverOffset === undefined || serverOffset === 0) return undefined
    const label =
      `Server runs on ${serverInfo.timezone} (` +
      (serverOffset === 0 ? "UTC" : `UTC${formatOffsetLabel(serverOffset)}`) +
      `)`
    return { label, suggestion: -serverOffset }
  }, [serverInfo?.timezone])

  return (
    <>
      <Typography variant="body2" color="text.secondary">
        If every program from a guide is shifted by a fixed amount, that
        backend stamps listings off from the real broadcast. Correct each
        guide separately, corrections apply to times, live badges, and
        progress bars.
      </Typography>

      <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          This device: {deviceTimeZone}
        </Typography>
        {serverInfo?.timezone && (
          <Typography variant="caption" color="text.secondary">
            Server timezone: {serverInfo.timezone}
            {serverInfo.time_now ? ` (server time: ${serverInfo.time_now})` : ""}
          </Typography>
        )}
        {serverTimestamp !== undefined && (
          <Typography variant="caption" color="text.secondary">
            Server clock now:{" "}
            {new Date(serverTimestamp * 1000).toLocaleString([], {
              weekday: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Typography>
        )}
      </Box>

      {isXtream && (
        <OffsetSourceRow
          sourceId={XTREAM_BULK_SOURCE_ID}
          title="Provider guide (Xtream)"
          subtitle="Bulk download from your provider"
          serverSuggestion={bulkSuggestion}
        />
      )}
      {savedUrls.map((url) => (
        <OffsetSourceRow
          key={url}
          sourceId={extEpgSourceId(url)}
          title="External guide"
          subtitle={url}
        />
      ))}
      {!isXtream && savedUrls.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          No program-guide sources. Playlist channels have no listings until
          you add an external XML guide in Settings.
        </Typography>
      )}
    </>
  )
}
