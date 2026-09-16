import { FC, memo } from "react"
import { SeriesEpisode } from "../services/XtremeCodesAPI.types"
import Box from "@mui/material/Box"
import Card from "@mui/material/Card"
import CardActionArea from "@mui/material/CardActionArea"
import CardContent from "@mui/material/CardContent"
import Typography from "@mui/material/Typography"
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded"

export interface EpisodesCarouselProps {
  episodes: SeriesEpisode[]
  activeEpisode?: SeriesEpisode
  onEpisodeClick: (episode: SeriesEpisode) => void
}

export const EpisodesCarousel: FC<EpisodesCarouselProps> = memo((props) => {
  const { episodes, onEpisodeClick, activeEpisode } = props

  if (episodes.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ p: 2 }}>
        No episodes available.
      </Typography>
    )
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 1.5,
        p: 1,
      }}
    >
      {episodes.map((item) => {
        const active = activeEpisode?.id === item.id
        return (
          <Card
            key={item.id ?? item.episode_num}
            sx={{
              borderRadius: 2,
              bgcolor: active ? "rgba(0,212,255,0.10)" : "background.paper",
              border: "1px solid",
              borderColor: active ? "rgba(0,212,255,0.5)" : "divider",
              transition: "transform 0.15s ease, border-color 0.15s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                borderColor: "rgba(0,212,255,0.35)",
              },
            }}
          >
            <CardActionArea onClick={() => onEpisodeClick(item)} sx={{ p: 1.5 }}>
              <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {active && (
                    <PlayArrowRoundedIcon fontSize="small" color="primary" />
                  )}
                  <Typography variant="subtitle2" noWrap sx={{ flex: 1, minWidth: 0, fontWeight: 600 }}>
                    {item.title ?? `Episode ${item.episode_num}`}
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.5, fontVariantNumeric: "tabular-nums" }}
                >
                  S{item.season}:E{item.episode_num}
                  {item.info?.duration ? `  •  ${item.info.duration}` : ""}
                </Typography>
                {item.info?.plot && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.info.plot}
                  </Typography>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        )
      })}
    </Box>
  )
})
EpisodesCarousel.displayName = "EpisodesCarousel"
