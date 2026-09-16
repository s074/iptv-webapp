import IconButton from "@mui/material/IconButton"
import { FC } from "react"
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded"
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded"
import { useColorMode } from "../../theme"

export const ColorSchemeToggle: FC = () => {
  const { mode, toggleColorMode } = useColorMode()

  return (
    <IconButton
      id="toggle-mode"
      size="small"
      color="default"
      onClick={toggleColorMode}
      aria-label={
        mode === "light" ? "Switch to dark mode" : "Switch to light mode"
      }
    >
      {mode === "light" ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
    </IconButton>
  )
}
