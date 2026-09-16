import Card from "@mui/material/Card"
import CardActionArea from "@mui/material/CardActionArea"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import LiveTvRoundedIcon from "@mui/icons-material/LiveTvRounded"
import { FC, memo } from "react"
import { LiveStream } from "../services/XtremeCodesAPI.types"

export interface ChannelCardProps {
  stream: LiveStream
  selected?: boolean
  onStreamClick: (stream: LiveStream) => void
}

export const ChannelCard: FC<ChannelCardProps> = memo((props) => {
  const { stream, selected = false, onStreamClick } = props

  return (
    <Card
      sx={{
        width: "100%",
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: selected ? "rgba(0,212,255,0.10)" : "background.paper",
        border: "1px solid",
        borderColor: selected ? "rgba(0,212,255,0.5)" : "divider",
        transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
          borderColor: "rgba(0,212,255,0.35)",
        },
      }}
    >
      <CardActionArea
        onClick={() => onStreamClick(stream)}
        sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            overflow: "hidden",
            flexShrink: 0,
            bgcolor: "rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {stream.stream_icon ? (
            <Box
              component="img"
              src={stream.stream_icon}
              alt=""
              loading="lazy"
              sx={{ width: "100%", height: "100%", objectFit: "contain", p: 0.5 }}
            />
          ) : (
            <LiveTvRoundedIcon sx={{ color: "text.disabled" }} />
          )}
        </Box>
        <Typography
          variant="body2"
          noWrap
          title={stream.name}
          sx={{ flex: 1, minWidth: 0, fontWeight: selected ? 600 : 500 }}
        >
          {stream.name}
        </Typography>
      </CardActionArea>
    </Card>
  )
})
ChannelCard.displayName = "ChannelCard"
