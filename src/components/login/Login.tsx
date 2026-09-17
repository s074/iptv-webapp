import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Paper from "@mui/material/Paper"
import Tab from "@mui/material/Tab"
import Tabs from "@mui/material/Tabs"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import LiveTvRoundedIcon from "@mui/icons-material/LiveTvRounded"
import UploadRoundedIcon from "@mui/icons-material/UploadRounded"
import { useState } from "react"
import { useAppDispatch } from "../../store/hooks"
import { setApiConfig, setAppStatus, setMediaSource } from "../../store/app/appSlice"
import {
  fetchAccountInfo
} from "../../store/app/thunks"
import { fetchSeriesCategoriesAsync, fetchSeriesStreamsAsync } from "../../store/series/seriesSlice"
import { fetchVodCategoriesAsync, fetchVodStreamsAsync } from "../../store/vod/vodSlice"
import { connectM3UPlaylist, fetchLiveCategoriesAsync, fetchLiveStreamsAsync } from "../../store/live/liveSlice"
import { MediaSource } from "../../store/types"

type LoginMode = "xtream" | "m3u-url" | "m3u-file"

export const Login: React.FC = () => {
  const [mode, setMode] = useState<LoginMode>("xtream")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [playlistUrl, setPlaylistUrl] = useState("")
  const [playlistFile, setPlaylistFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const dispatch = useAppDispatch()
  const [status, setStatus] = useState<"idle" | "pending" | "loading">("idle")

  const canSubmitXtream =
    [username, password, baseUrl].every(Boolean) && status === "idle"
  const canSubmitM3U =
    (mode === "m3u-url" ? Boolean(playlistUrl) : playlistFile !== null) &&
    status === "idle"

  const handleXtreamSubmit = async () => {
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
      setError("Could not log in to the Xtream server , check the URL and credentials")
      setStatus("idle")
      return
    }

    setStatus("loading")
    dispatch(setApiConfig(config))
    dispatch(setMediaSource({ kind: "xtream" }))
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

  const connectPlaylist = async (text: string, meta: MediaSource, base?: string) => {
    setStatus("pending")
    try {
      await dispatch(connectM3UPlaylist({ text, baseUrl: base })).unwrap()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that playlist")
      setStatus("idle")
      return
    }

    setStatus("loading")
    dispatch(setMediaSource(meta))
    dispatch(setAppStatus("ready"))
  }

  const handleM3UUrlSubmit = async () => {
    if (!playlistUrl.toLocaleLowerCase().startsWith("http")) {
      setError("Enter a valid playlist URL starting with http(s)://")
      return
    }

    setStatus("pending")
    let text: string
    try {
      const response = await fetch(playlistUrl)
      if (!response.ok) {
        setError(`Playlist download failed (HTTP ${response.status})`)
        setStatus("idle")
        return
      }
      text = await response.text()
    } catch (e) {
      setError("Could not download that playlist — check the URL")
      setStatus("idle")
      return
    }

    await connectPlaylist(text, {
      kind: "m3u",
      origin: "url",
      url: playlistUrl,
      fetchedAt: Date.now(),
    }, playlistUrl)
  }

  const handleM3UFileSubmit = async () => {
    if (!playlistFile) {
      setError("Choose a playlist file first")
      return
    }

    setStatus("pending")
    let text: string
    try {
      text = await playlistFile.text()
    } catch (e) {
      setError("Could not read that file")
      setStatus("idle")
      return
    }

    await connectPlaylist(text, {
      kind: "m3u",
      origin: "file",
      fileName: playlistFile.name,
      fetchedAt: Date.now(),
    })
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
          width: 380,
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
              {mode === "xtream" ? "Xtream Login" : "Playlist Login"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {mode === "xtream"
                ? "Sign in with your Xtream Codes account."
                : "Every playlist entry becomes a channel."}
            </Typography>
          </div>
        </Box>
        <Tabs
          value={mode}
          onChange={(_, next: LoginMode) => {
            setMode(next)
            setError("")
            setStatus("idle")
          }}
          variant="fullWidth"
        >
          <Tab value="xtream" label="Xtream" />
          <Tab value="m3u-url" label="Playlist URL" />
          <Tab value="m3u-file" label="Playlist File" />
        </Tabs>
        {error && error.length > 0 && (
          <Alert severity="error" variant="filled">
            {error}
          </Alert>
        )}

        {mode === "xtream" && (
          <>
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
              onClick={handleXtreamSubmit}
              disabled={!canSubmitXtream}
              loading={status !== "idle"}
              loadingPosition="start"
              variant="contained"
            >
              {status === "idle" && <>Connect to Xtream</>}
              {status === "pending" && <>Verifying Xtream login</>}
              {status === "loading" && <>Loading your playlist</>}
            </Button>
          </>
        )}

        {mode === "m3u-url" && (
          <>
            <TextField
              label="Playlist URL"
              name="playlist-url"
              type="text"
              placeholder="http://server.tv:8080/get.php?username=…"
              helperText="An .m3u / .m3u8 playlist. It is saved on this device so refreshes are instant."
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              fullWidth
              size="small"
            />
            <Button
              sx={{ mt: 1 }}
              onClick={handleM3UUrlSubmit}
              disabled={!canSubmitM3U}
              loading={status !== "idle"}
              loadingPosition="start"
              variant="contained"
            >
              {status === "idle" && <>Load playlist</>}
              {status === "pending" && <>Downloading playlist</>}
              {status === "loading" && <>Loading channels</>}
            </Button>
          </>
        )}

        {mode === "m3u-file" && (
          <>
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadRoundedIcon />}
            >
              {playlistFile ? playlistFile.name : "Choose playlist file"}
              <input
                type="file"
                accept=".m3u,.m3u8,audio/x-mpegurl,application/x-mpegurl"
                hidden
                onChange={(e) => setPlaylistFile(e.target.files?.[0] ?? null)}
              />
            </Button>
            <Typography variant="caption" color="text.secondary">
              An .m3u / .m3u8 file from your provider. It is saved on this
              device so refreshes are instant.
            </Typography>
            <Button
              sx={{ mt: 1 }}
              onClick={handleM3UFileSubmit}
              disabled={!canSubmitM3U}
              loading={status !== "idle"}
              loadingPosition="start"
              variant="contained"
            >
              {status === "idle" && <>Load playlist</>}
              {status === "pending" && <>Reading playlist</>}
              {status === "loading" && <>Loading channels</>}
            </Button>
          </>
        )}
      </Paper>
    </Box>
  )
}
