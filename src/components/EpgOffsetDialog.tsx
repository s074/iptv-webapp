import { FC } from "react"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import IconButton from "@mui/material/IconButton"
import Typography from "@mui/material/Typography"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import { glassDialogSlotProps } from "./glassDialog"
import { EpgOffsetControls } from "./EpgOffsetControls"

interface EpgOffsetDialogProps {
  open: boolean
  onClose: () => void
}

export const EpgOffsetDialog: FC<EpgOffsetDialogProps> = (props) => {
  const { open, onClose } = props

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
        <EpgOffsetControls />
        <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={onClose}>
          Done
        </Button>
      </DialogContent>
    </Dialog>
  )
}
