import { FC, useEffect, useState } from "react"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import CircularProgress from "@mui/material/CircularProgress"
import LinearProgress from "@mui/material/LinearProgress"
import IconButton from "@mui/material/IconButton"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemText from "@mui/material/ListItemText"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import {
  fetchExternalEpgAsync,
  removeExternalEpgUrl,
  selectExternalEpg,
  selectExternalEpgError,
  selectExternalEpgStatus,
} from "../store/live/liveSlice"
import {
  addExternalEpgUrl,
  getExternalEpgUrls,
  removeExternalEpgUrl as removePersistedEpgUrl,
  subscribeGuideProgress,
  type GuideProgress,
} from "../services/externalEpg"
import { EpgOffsetControls } from "../components/EpgOffsetControls"
import { HideCategoriesModal } from "../components/HideCategoriesModal"
import {
  HiddenCategoryType,
  selectHiddenCategories,
} from "../store/hiddenCategories/hiddenCategoriesSlice"
import { thinScrollbarSx } from "../components/scrollbar"

export const Settings: FC = () => {
  const dispatch = useAppDispatch()
  const [urlInput, setUrlInput] = useState("")
  const [savedUrls, setSavedUrls] = useState<string[]>([])
  const [urlError, setUrlError] = useState("")
  const [progress, setProgress] = useState<GuideProgress | null>(null)
  const externalEpg = useAppSelector(selectExternalEpg)
  const externalStatus = useAppSelector(selectExternalEpgStatus)
  const externalError = useAppSelector(selectExternalEpgError)
  const hidden = useAppSelector(selectHiddenCategories)
  const [hideModal, setHideModal] = useState<{
    type: HiddenCategoryType
    label: string
  } | null>(null)

  useEffect(() => {
    getExternalEpgUrls().then(setSavedUrls)
    return subscribeGuideProgress((update) => {
      setProgress(update.done ? null : update)
    })
  }, [])

  const programmeCount = Object.values(externalEpg).reduce(
    (total, byChannel) => total + Object.values(byChannel).reduce(
      (sub, list) => sub + list.length,
      0,
    ),
    0,
  )
  const channelCount = new Set(
    Object.values(externalEpg).flatMap((byChannel) => Object.keys(byChannel)),
  ).size

  const handleAddAndLoad = async () => {
    const url = urlInput.trim()
    if (!url.toLowerCase().startsWith("http")) {
      setUrlError("Enter a valid guide URL starting with http(s)://")
      return
    }
    setUrlError("")
    setSavedUrls(await addExternalEpgUrl(url))
    setUrlInput("")
    await dispatch(fetchExternalEpgAsync({ url })).unwrap().catch(() => {})
  }

  const handleRemove = async (url: string) => {
    setSavedUrls(await removePersistedEpgUrl(url))
    dispatch(removeExternalEpgUrl(url))
  }

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
        ...thinScrollbarSx,
      }}
    >
      <Box sx={{ maxWidth: 960, mx: "auto", pb: 4 }}>
        <Box sx={{ px: 1, pt: 1, pb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Guide time and optional program data.
          </Typography>
        </Box>

        <Box sx={{ px: 1, pb: 2 }}>
          <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Manage hidden categories
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Hidden categories disappear from browsers and the guide.
                Stored on this device like watchlist and favorites.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.5 }}>
                {(
                  [
                    { type: "live", label: "Live TV categories" },
                    { type: "vod", label: "Movies categories" },
                    { type: "series", label: "TV Shows categories" },
                  ] as { type: HiddenCategoryType; label: string }[]
                ).map(({ type, label }) => (
                  <Button
                    key={type}
                    variant="outlined"
                    onClick={() => setHideModal({ type, label })}
                  >
                    {label}
                    {hidden[type].length > 0 && ` (${hidden[type].length} hidden)`}
                  </Button>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ px: 1, pb: 2 }}>
          <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                EPG time correction
              </Typography>
              <Box sx={{ mt: 1 }}>
                <EpgOffsetControls />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {hideModal && (
          <HideCategoriesModal
            open={true}
            onClose={() => setHideModal(null)}
            type={hideModal.type}
            title={hideModal.label}
          />
        )}

        <Box sx={{ px: 1 }}>
          <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                External guide (XMLTV)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                XML guide URLs fill in program listings for channels that
                have none, mainly useful with playlist sources. Only the URL
                list is kept; guide data lives in memory and re-downloads
                when you open Live TV.
              </Typography>
              {urlError && (
                <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setUrlError("")}>
                  {urlError}
                </Alert>
              )}
              {savedUrls.length > 0 && (
                <List dense disablePadding sx={{ mt: 1 }}>
                  {savedUrls.map((saved) => (
                    <ListItem
                      key={saved}
                      disablePadding
                      sx={{ mb: 0.5 }}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          size="small"
                          aria-label={`remove ${saved}`}
                          onClick={() => handleRemove(saved)}
                        >
                          <DeleteRoundedIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={saved}
                        slotProps={{
                          primary: {
                            noWrap: true,
                            variant: "body2",
                          },
                        }}
                        sx={{ pr: 4 }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              <TextField
                size="small"
                fullWidth
                label="Add guide URL (.xml, .xml.gz)"
                placeholder="https://example.com/guide.xml"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                sx={{ mt: 1.5 }}
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.5 }}>
                <Button
                  variant="contained"
                  onClick={handleAddAndLoad}
                  disabled={externalStatus === "loading"}
                >
                  Add and load now
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                {externalStatus === "loading" && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={18} />
                    <Typography variant="body2" color="text.secondary">
                      Downloading guide…
                    </Typography>
                  </Box>
                )}
              </Stack>
              {progress && !progress.done && (
                <Box sx={{ mt: 1.5 }}>
                  <LinearProgress
                    variant={
                      progress.totalBytes ? "determinate" : "indeterminate"
                    }
                    value={
                      progress.totalBytes
                        ? Math.min(
                            100,
                            (progress.receivedBytes / progress.totalBytes) * 100,
                          )
                        : undefined
                    }
                  />
                  <Typography variant="caption" color="text.secondary">
                    {(progress.receivedBytes / 1048576).toFixed(1)} MB
                    {progress.totalBytes
                      ? ` of ${(progress.totalBytes / 1048576).toFixed(1)} MB`
                      : " downloaded"}
                  </Typography>
                </Box>
              )}
              {externalStatus === "ready" && (
                <Typography variant="body2" color="success.main" sx={{ mt: 1.5 }}>
                  Loaded {programmeCount} programmes for {channelCount}{" "}
                  channels.
                </Typography>
              )}
              {externalStatus === "error" && (
                <Alert severity="error" sx={{ mt: 1.5 }}>
                  {externalError ?? "Could not load that guide."}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  )
}
