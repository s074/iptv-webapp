import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Paper from "@mui/material/Paper"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import LiveTvRoundedIcon from "@mui/icons-material/LiveTvRounded"
import { useState } from "react"
import { useAppDispatch } from "../../store/hooks"
import { setApiConfig, setAppStatus } from "../../store/app/appSlice"
import {
  fetchAccountInfo
} from "../../store/app/thunks"
import { fetchSeriesCategoriesAsync, fetchSeriesStreamsAsync } from "../../store/series/seriesSlice"
import { fetchVodCategoriesAsync, fetchVodStreamsAsync } from "../../store/vod/vodSlice"
import { fetchLiveCategoriesAsync, fetchLiveStreamsAsync } from "../../store/live/liveSlice"

export const Login: React.FC = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [error, setError] = useState("")
  const dispatch = useAppDispatch()
  const [status, setStatus] = useState<"idle" | "pending" | "loading">("idle")

  const canSubmit =
    [username, password, baseUrl].every(Boolean) && status === "idle"

  const handleSubmit = async () => {
    if (!baseUrl || !baseUrl.toLocaleLowerCase().startsWith("http")) {
      setError("Enter a valid Xtream server URL starting with http(s)://")
      return
    }

    if (!username || username.length === 0) {
      setError("Username must be provided")
      return
    }

    if (!password || password.length === 0) {
      setError("Password must be provided")
      return
    }

    if (
      window.location.protocol === "https:" &&
      !baseUrl.toLocaleLowerCase().startsWith("https")
    ) {
      setError(
        "You must provide an https url when connecting from an https client",
      )
      return
    }

    setStatus("pending")

    const config = {
      baseUrl,
      auth: {
        username,
        password,
      },
    }

    try {
      await dispatch(fetchAccountInfo({ config })).unwrap()
    } catch (e) {
      setError("Could not log in to the Xtream server — check the URL and credentials")
      setStatus("idle")
      return
    }

    setStatus("loading")
    dispatch(setApiConfig(config))
    // load common app stuff
    try {
      await Promise.all([
        dispatch(fetchLiveCategoriesAsync()).unwrap(),
        dispatch(fetchVodCategoriesAsync()).unwrap(),
        dispatch(fetchSeriesCategoriesAsync()).unwrap(),
        dispatch(fetchLiveStreamsAsync()).unwrap(),
        dispatch(fetchVodStreamsAsync()).unwrap(),
        dispatch(fetchSeriesStreamsAsync()).unwrap(),
      ])
    } catch (e) {
      console.log(e)
    }

    dispatch(setAppStatus("ready"))
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: 360,
          maxWidth: "100%",
          py: 3,
          px: 2.5,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          borderRadius: 3,
        }}
        variant="outlined"
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <LiveTvRoundedIcon color="primary" fontSize="large" />
          <div>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
              Xtream Login
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in with your Xtream Codes account.
            </Typography>
          </div>
        </Box>
        {error && error.length > 0 && (
          <Alert severity="error" variant="filled">
            {error}
          </Alert>
        )}
        <TextField
          label="Xtream server URL"
          name="url"
          type="text"
          placeholder="http://server.tv:8080"
          helperText="The host URL (no trailing path needed)."
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          fullWidth
          size="small"
        />
        <TextField
          label="Xtream username"
          name="username"
          placeholder="e.g. johndoe123"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          fullWidth
          size="small"
        />
        <TextField
          label="Xtream password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          size="small"
        />

        <Button
          sx={{ mt: 1 }}
          onClick={handleSubmit}
          disabled={!canSubmit}
          loading={status !== "idle"}
          loadingPosition="start"
          variant="contained"
        >
          {status === "idle" && <>Connect to Xtream</>}
          {status === "pending" && <>Verifying Xtream login</>}
          {status === "loading" && <>Loading your playlist</>}
        </Button>
      </Paper>
    </Box>
  )
}
