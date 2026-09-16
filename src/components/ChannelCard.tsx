import Card from "@mui/material/Card"
import CardActionArea from "@mui/material/CardActionArea"
import CardContent from "@mui/material/CardContent"
import CardMedia from "@mui/material/CardMedia"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { FC } from "react"
import { LiveStream } from "../services/XtremeCodesAPI.types"

export interface ChannelCardProps {
  stream: LiveStream
  selected?: boolean
  onStreamClick: (stream: LiveStream) => void
}

export const ChannelCard: FC<ChannelCardProps> = (props) => {
  const { stream, selected = false, onStreamClick } = props

  return (
    <Card
      sx={{
        m: 1,
        flexGrow: 1,
        minWidth: 150,
        maxWidth: 280,
        height: "100%",
        position: "relative",
        border: selected ? "1px solid" : "1px solid transparent",
        borderColor: selected ? "primary.light" : "transparent",
        outline: selected ? "#fff solid 2px" : "none",
        "&:hover": {
          boxShadow: 6,
          outline: "#fff solid 2px",
        },
      }}
    >
      <CardActionArea onClick={() => onStreamClick(stream)} sx={{ height: "100%" }}>
        <CardMedia
          component="img"
          image={stream.stream_icon}
          alt=""
          loading="lazy"
          sx={{ objectFit: "contain", aspectRatio: "16/9" }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.4), rgba(0,0,0,0) 200px), linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0) 300px)",
          }}
        />
        <CardContent sx={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
          <Typography variant="body2" color="#fff" noWrap>
            {stream.name}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
