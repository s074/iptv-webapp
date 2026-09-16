import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"
import {
  createTheme,
  ThemeProvider,
  type PaletteMode,
  type Theme,
} from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"

const STORAGE_KEY = "my-tv-app-color-mode"

function getStoredMode(): PaletteMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "light" || stored === "dark") return stored
  } catch {
    // ignore (SSR / private mode)
  }
  return "dark"
}

function buildTheme(mode: PaletteMode): Theme {
  return createTheme({
    palette: {
      mode,
      ...(mode === "dark"
        ? {
            background: {
              default: "#0a0e14",
              paper: "#12161d",
            },
          }
        : {}),
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 500,
            borderRadius: 8,
          },
          outlined: {
            borderColor:
              mode === "dark"
                ? "rgba(255, 255, 255, 0.16)"
                : "rgba(0, 0, 0, 0.2)",
            "&:hover": {
              backgroundColor:
                mode === "dark"
                  ? "rgba(255, 255, 255, 0.06)"
                  : "rgba(0, 0, 0, 0.04)",
              borderColor:
                mode === "dark"
                  ? "rgba(255, 255, 255, 0.28)"
                  : "rgba(0, 0, 0, 0.32)",
            },
          },
          contained: {
            boxShadow: "none",
            "&:hover": {
              boxShadow:
                mode === "dark"
                  ? "0 2px 10px rgba(0, 0, 0, 0.45)"
                  : "0 2px 8px rgba(0, 0, 0, 0.18)",
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
    },
  })
}

interface ColorModeContextValue {
  mode: PaletteMode
  toggleColorMode: () => void
  setColorMode: (mode: PaletteMode) => void
}

const ColorModeContext = createContext<ColorModeContextValue>({
  mode: "dark",
  toggleColorMode: () => {},
  setColorMode: () => {},
})

export function useColorMode(): ColorModeContextValue {
  return useContext(ColorModeContext)
}

export function AppThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [mode, setMode] = useState<PaletteMode>(getStoredMode)

  const setColorMode = useCallback((next: PaletteMode) => {
    setMode(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }, [])

  const toggleColorMode = useCallback(() => {
    setMode((prev) => {
      const next: PaletteMode = prev === "light" ? "dark" : "light"
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const theme = useMemo(() => buildTheme(mode), [mode])
  const value = useMemo(
    () => ({ mode, toggleColorMode, setColorMode }),
    [mode, toggleColorMode, setColorMode],
  )

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

export default buildTheme
