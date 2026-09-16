import Card from "@mui/material/Card"
import CardActionArea from "@mui/material/CardActionArea"
import CardMedia from "@mui/material/CardMedia"
import Box from "@mui/material/Box"
import Chip from "@mui/material/Chip"
import Typography from "@mui/material/Typography"
import StarRoundedIcon from "@mui/icons-material/StarRounded"
import { FC, memo } from "react"
import { isVod } from "../services/utils"
import { SeriesStream, VodStream } from "../services/XtremeCodesAPI.types"

export interface MediaCardProps {
  stream: VodStream | SeriesStream
  onStreamClick: (stream: VodStream | SeriesStream) => void
}

export const MediaCard: FC<MediaCardProps> = memo((props) => {
  const { stream, onStreamClick } = props
  const poster = isVod(stream) ? stream.stream_icon : stream.cover
  const rating = Number(stream.rating)

  return (
    <Card
      sx={{
        width: "100%",
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,212,255,0.35)",
          borderColor: "rgba(0,212,255,0.35)",
        },
      }}
    >
      <CardActionArea onClick={() => onStreamClick(stream)}>
        <Box sx={{ position: "relative", aspectRatio: "2/3", bgcolor: "rgba(255,255,255,0.04)" }}>
          <CardMedia
            component="img"
            image={poster}
            alt={stream.name ?? ""}
            loading="lazy"
            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 45%, transparent 70%)",
            }}
          />
          {!Number.isNaN(rating) && rating > 0 && (
            <Chip
              size="small"
              icon={<StarRoundedIcon sx={{ fontSize: 14 }} />}
              label={rating.toFixed(1)}
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
                height: 22,
                fontSize: "0.7rem",
                fontWeight: 700,
                bgcolor: "rgba(0,0,0,0.65)",
                color: "#ffd54f",
                backdropFilter: "blur(6px)",
                "& .MuiChip-icon": { color: "#ffd54f" },
              }}
            />
          )}
          <Box
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              p: { xs: 0.75, sm: 1.25 },
            }}
          >
            <Typography
              variant="subtitle2"
              noWrap
              title={stream.name}
              sx={{ color: "#fff", lineHeight: 1.25, fontWeight: 600 }}
            >
              {stream.name}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{ color: "rgba(255,255,255,0.6)" }}
            >
              {isVod(stream) ? "Movie" : "Series"}
              {stream.rating ? `  •  ${stream.rating}/10` : ""}
            </Typography>
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  )
})
MediaCard.displayName = "MediaCard"
