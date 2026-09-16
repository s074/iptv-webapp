import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Paper from "@mui/material/Paper"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
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
      setError("Invalid url")
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
      setError("There was an error logging in")
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
    <Box component="main">
      <Paper
        elevation={3}
        sx={{
          width: 300,
          mx: "auto",
          my: 4,
          py: 3,
          px: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          borderRadius: 2,
        }}
        variant="outlined"
      >
        <div>
          <Typography variant="h5" component="h1">
            <b>Welcome!</b>
          </Typography>
          <Typography variant="body2" color="text.secondary">Sign in to continue.</Typography>
        </div>
        {error && error.length > 0 && (
          <Alert severity="error" variant="filled">
            {error}
          </Alert>
        )}
        <TextField
          label="Url"
          name="url"
          type="text"
          placeholder="http://my-url:port"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          fullWidth
          size="small"
        />
        <TextField
          label="Username"
          name="username"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          fullWidth
          size="small"
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          placeholder="password"
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
          {status === "idle" && <>Log in</>}
          {status === "pending" && <>Submitting</>}
          {status === "loading" && <>Performing initial load</>}
        </Button>
      </Paper>
    </Box>
  )
}
