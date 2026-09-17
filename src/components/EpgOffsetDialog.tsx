import { FC, useMemo, useState } from "react"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Chip from "@mui/material/Chip"
import Dialog from "@mui/material/Dialog"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import IconButton from "@mui/material/IconButton"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import { useAppSelector } from "../store/hooks"
import { selectAppState } from "../store/app/selector"
import {
  formatOffsetLabel,
  getTimeZoneOffsetMinutes,
  setEpgOffsetMinutes,
  useEpgOffsetMinutes,
} from "../services/epgTime"
import { glassDialogSlotProps } from "./glassDialog"

const PRESET_MINUTES = [-180, -120, -60, -30, 0, 30, 60, 120, 180]
// DWTS listing from a real response , gives users a concrete preview.
const SAMPLE_EPOCH = 1789610400

function formatPreview(epochSeconds: number, offsetMinutes: number): string {
  return new Date((epochSeconds + offsetMinutes * 60) * 1000).toLocaleString(
    [],
    { weekday: "short", hour: "2-digit", minute: "2-digit" },
  )
}

interface EpgOffsetDialogProps {
  open: boolean
  onClose: () => void
}

export const EpgOffsetDialog: FC<EpgOffsetDialogProps> = (props) => {
  const { open, onClose } = props
  const offsetMinutes = useEpgOffsetMinutes()
  const { accountInfo } = useAppSelector(selectAppState)
  const [custom, setCustom] = useState("")

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

  // If the panel stamps server-wall time as UTC, the correction is the
  // negative of the server's UTC offset. Offered as a one-tap suggestion,
  // never auto-applied , the mechanism is inferred, and DST can move it.
  const serverSuggestion = useMemo(() => {
    if (!serverInfo?.timezone) return undefined
    const serverOffset = getTimeZoneOffsetMinutes(serverInfo.timezone)
    if (serverOffset === undefined || serverOffset === 0) return undefined
    const suggestion = -serverOffset
    if (suggestion === offsetMinutes) return undefined
    return { timeZone: serverInfo.timezone, serverOffset, suggestion }
  }, [serverInfo?.timezone, offsetMinutes])

  const applyCustom = (raw: string) => {
    setCustom(raw)
    if (raw.trim() === "") return
    const num = Number(raw)
    if (!Number.isFinite(num)) return
    setEpgOffsetMinutes(Math.max(-1439, Math.min(1439, Math.round(num))))
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      scroll="paper"
      slotProps={glassDialogSlotProps}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pr: 1 }}>
        <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 600 }}>
          Correct EPG time
        </Typography>
        <IconButton size="small" onClick={onClose} aria-label="close">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary">
          If every program is shifted by a fixed amount, your provider stamps
          listings off from the real broadcast. Pick the correction that lines
          them up , it applies to times, live badges, and progress bars.
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

        <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
          {PRESET_MINUTES.map((minutes) => (
            <Chip
              key={minutes}
              label={formatOffsetLabel(minutes)}
              color={offsetMinutes === minutes ? "primary" : "default"}
              variant={offsetMinutes === minutes ? "filled" : "outlined"}
              onClick={() => setEpgOffsetMinutes(minutes)}
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Box>

        {serverSuggestion && (
          <Box
            sx={{
              mt: 2,
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
                Server runs on {serverSuggestion.timeZone} (
                {formatOffsetLabel(serverSuggestion.serverOffset) === "Auto"
                  ? "UTC"
                  : `UTC${formatOffsetLabel(serverSuggestion.serverOffset)}`}
                )
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Listings look stamped in server time , apply{" "}
                {formatOffsetLabel(serverSuggestion.suggestion)}?
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={() => setEpgOffsetMinutes(serverSuggestion.suggestion)}
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
          sx={{ mt: 2 }}
          slotProps={{ htmlInput: { step: 30, min: -1439, max: 1439 } }}
        />

        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "action.hover",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Preview , a 02:00 UTC listing will display as:
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {formatPreview(SAMPLE_EPOCH, offsetMinutes)}
          </Typography>
        </Box>

        <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={onClose}>
          Done
        </Button>
      </DialogContent>
    </Dialog>
  )
}
