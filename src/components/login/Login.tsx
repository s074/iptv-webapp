import {
  Alert,
  Button,
  FormControl,
  FormLabel,
  Input,
  Sheet,
  Typography,
} from "@mui/joy"
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
    <main>
      <Sheet
        sx={{
          width: 300,
          mx: "auto", // margin left & right
          my: 4, // margin top & bottom
          py: 3, // padding top & bottom
          px: 2, // padding left & right
          display: "flex",
          flexDirection: "column",
          gap: 2,
          borderRadius: "sm",
          boxShadow: "md",
          bgcolor: "background.appBody",
        }}
        variant="outlined"
      >
        <div>
          <Typography level="h4" component="h1">
            <b>Welcome!</b>
          </Typography>
          <Typography level="body-sm">Sign in to continue.</Typography>
        </div>
        {error && error.length > 0 && (
          <Alert color="danger" variant="solid">
            {error}
          </Alert>
        )}
        <FormControl>
          <FormLabel>Url</FormLabel>
          <Input
            name="url"
            type="input"
            placeholder="http://my-url:port"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Username</FormLabel>
          <Input
            name="username"
            type="username"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Password</FormLabel>
          <Input
            name="password"
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormControl>

        <Button
          sx={{ mt: 1 }}
          loading={status !== "idle"}
          loadingPosition="start"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {status === "idle" && <>Log in</>}
          {status === "pending" && <>Submitting</>}
          {status === "loading" && <>Performing initial load</>}
        </Button>
      </Sheet>
    </main>
  )
}
