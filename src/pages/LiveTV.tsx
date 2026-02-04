import { FC, useCallback, useEffect, useRef, useState } from "react"
import { useAppSelector } from "../store/hooks"
import { selectLiveCategories, selectLiveStreams } from "../store/live/liveSlice"
import {
  Box,
  Container,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemContent,
  IconButton,
  Typography,
} from "@mui/joy"
import { Category, LiveStream } from "../services/XtremeCodesAPI.types"
import { KeyboardArrowRight, KeyboardArrowDown, Menu } from "@mui/icons-material"
import { containerToMimeType } from "../services/utils"
import videojs from "video.js"
import Player from "video.js/dist/types/player"
import { VideoPlayer } from "../components/VideoPlayer"
import { useSearchParams } from "react-router-dom"
import { useChannelUrl } from "../components/useMediaUrl"
import { ShortEpgComponent } from "../components/ShortEpgComponent"

export const LiveTV: FC = () => {
  const liveStreams = useAppSelector(selectLiveStreams)
  const liveStreamCategories = useAppSelector(selectLiveCategories)
  const [selectedStream, setSelectedStream] = useState<LiveStream | undefined>(
    undefined,
  )
  const [selectedCategory, setSelectedCategory] = useState<
    Category | undefined
  >(undefined)
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const playerRef = useRef<Player | null>(null)
  const url = useChannelUrl(selectedStream?.stream_id ?? 0, "m3u8")

  console.log(liveStreams)
  console.log(selectedStream)

  const channelId = searchParams.get("channel")

  useEffect(() => {
    const firstCategory = liveStreamCategories.find(
      (item) => item.category_id !== undefined,
    )

    if (channelId) {
      const stream = liveStreams.find(
        (stream) => stream.stream_id === Number(channelId),
      )
      if (stream) {
        setSelectedStream(stream)
        const category = liveStreamCategories.find(
          (category) => category.category_id === stream.category_id,
        )
        if (category) setSelectedCategory(category)
        else setSelectedCategory(firstCategory)
      }
      return
    }

    setSelectedCategory(firstCategory)

    setSelectedStream(
      liveStreams
        .filter((stream) => stream.category_id === firstCategory?.category_id)
        .find((item) => item !== undefined),
    )
  }, [channelId, liveStreamCategories, liveStreams])

  const onStreamClick = (stream: LiveStream) => {
    if (stream.stream_id === undefined) return

    setSearchParams((prev) => {
      prev.set("channel", stream.stream_id!.toString())
      return prev
    })
  }

  const categoryLiveStreams = useCallback(() => {
    return liveStreams.filter(
      (stream) => stream.category_id === selectedCategory?.category_id,
    )
  }, [liveStreams, selectedCategory])

  const videoJsOptions = useCallback(() => {
    return {
      autoplay: true,
      preload: "true",
      controls: true,
      responsive: true,
      fluid: true,
      sources: [
        {
          src: url,
          type: containerToMimeType("m3u8"),
        },
      ],
    }
  }, [url])

  const handlePlayerReady = (player: Player) => {
    playerRef.current = player

    player.on("error", (e: any) => {
      console.log(e)
    })

    // You can handle player events here, for example:
    player.on("waiting", () => {
      videojs.log("player is waiting")
    })

    player.on("dispose", () => {
      videojs.log("player will dispose")
    })
  }

  return (
    <Box
      sx={{
        maxHeight: "100vh",
        maxWidth: "100vw",
        height: "100%",
        width: "100%",
      }}
    >
      <Container maxWidth="lg">
        <VideoPlayer options={videoJsOptions()} onReady={handlePlayerReady} />
      </Container>
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        <Grid container spacing={2} sx={{
          height: "600px", 
        }}
        xs={12}>
          <Grid
            xs={12}
            md={2}
            sx={{
              height: { xs: "auto", md: "100%" },
              maxHeight: { xs: categoriesCollapsed ? "48px" : "310px", md: "100%" },
              overflow: "hidden",
              borderRight: { md: "1px solid" },
              borderBottom: { xs: "1px solid", md: "none" },
              borderColor: "divider",
              transition: "max-height 0.3s ease-in-out",
            }}
          >
            {/* Mobile toggle header */}
            <Box
              sx={{
                display: { xs: "flex", md: "none" },
                alignItems: "center",
                justifyContent: "space-between",
                p: 1,
                borderBottom: categoriesCollapsed ? "none" : "1px solid",
                borderColor: "divider",
                cursor: "pointer",
              }}
              onClick={() => setCategoriesCollapsed(!categoriesCollapsed)}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Menu />
                <Typography level="title-sm">
                  {selectedCategory?.category_name || "Categories"}
                </Typography>
              </Box>
              <IconButton size="sm" variant="plain">
                <KeyboardArrowDown
                  sx={{
                    transform: categoriesCollapsed ? "rotate(0deg)" : "rotate(180deg)",
                    transition: "transform 0.2s ease-in-out",
                  }}
                />
              </IconButton>
            </Box>
            {/* Categories list */}
            <Box
              sx={{
                display: { xs: categoriesCollapsed ? "none" : "block", md: "block" },
                height: { md: "100%" },
                maxHeight: { xs: "250px", md: "100%" },
                overflow: "auto",
              }}
            >
              <List
                variant="outlined"
                orientation="vertical"
                sx={{
                  borderRadius: "sm",
                  "--ListItem-paddingY": "1rem",
                }}
              >
                {liveStreamCategories.map((category) => (
                  <ListItem key={category.category_id}>
                    <ListItemButton
                      onClick={() => {
                        setSelectedCategory(category)
                        setCategoriesCollapsed(true) // Collapse on selection for mobile
                      }}
                      selected={selectedCategory === category}
                    >
                      <ListItemContent>{category.category_name}</ListItemContent>
                      <KeyboardArrowRight />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Grid>
          <Grid xs={12} md={10} sx={{ height: "100%", overflow: "auto" }}>
            <List
              variant="outlined"
              orientation="vertical"
              sx={{ borderRadius: "sm" }}
            >
              {categoryLiveStreams().map((liveStream) => (
                <ListItem key={liveStream.stream_id}>
                  <ListItemContent>
                    <Grid
                      container
                      sx={{
                        border: 0,
                        gap: 0,
                      }}
                    >
                      <Grid sm={12}>
                        <ShortEpgComponent
                          stream={liveStream}
                          onStreamClick={onStreamClick}
                          selected={selectedStream === liveStream}
                        />
                      </Grid>
                    </Grid>
                  </ListItemContent>
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
