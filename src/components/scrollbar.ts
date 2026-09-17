import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

// Shared thin scrollbar , spread into any scrollable `sx`.
// Theme-aware so the thumb stays visible in both dark and light mode.
export const thinScrollbarSx: SystemStyleObject<Theme> = {
  scrollbarWidth: "thin",
  scrollbarColor: (theme) =>
    theme.palette.mode === "dark"
      ? "rgba(255, 255, 255, 0.15) transparent"
      : "rgba(0, 0, 0, 0.3) transparent",
  "&::-webkit-scrollbar": { width: 6, height: 6 },
  "&::-webkit-scrollbar-track": { background: "transparent" },
  "&::-webkit-scrollbar-thumb": {
    background: (theme) =>
      theme.palette.mode === "dark"
        ? "rgba(255, 255, 255, 0.15)"
        : "rgba(0, 0, 0, 0.25)",
    borderRadius: 3,
  },
  "&::-webkit-scrollbar-thumb:hover": { background: "#00d4ff" },
}
