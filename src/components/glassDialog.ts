import type { DialogProps } from "@mui/material/Dialog"

// Shared glassy dialog surface , theme-aware so text stays
// readable in both dark and light mode.
export const glassDialogSlotProps: DialogProps["slotProps"] = {
  paper: {
    sx: {
      bgcolor: (theme) =>
        theme.palette.mode === "dark"
          ? "rgba(18, 22, 29, 0.88)"
          : "rgba(255, 255, 255, 0.92)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 3,
      backgroundImage: "none",
    },
  },
  backdrop: {
    sx: { bgcolor: "rgba(0, 0, 0, 0.6)" },
  },
}
