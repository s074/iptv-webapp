import Card from "@mui/material/Card"
import CardActionArea from "@mui/material/CardActionArea"
import CardContent from "@mui/material/CardContent"
import CardMedia from "@mui/material/CardMedia"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { FC } from "react"
import { isVod } from "../services/utils"
import { SeriesStream, VodStream } from "../services/XtremeCodesAPI.types"

export interface MediaCardProps {
  stream: VodStream | SeriesStream
  onStreamClick: (stream: VodStream | SeriesStream) => void
}

export const MediaCard: FC<MediaCardProps> = (props) => {
  const { stream, onStreamClick } = props

  return (
    <Card
      sx={{
        m: 1,
        flexGrow: 1,
        height: "100%",
        position: "relative",
        "&:hover": {
          boxShadow: 6,
          outline: "#fff solid 2px",
        },
      }}
    >
      <CardActionArea
        onClick={() => onStreamClick(stream)}
        sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}
      >
        <CardMedia
          component="img"
          image={isVod(stream) ? stream.stream_icon : stream.cover}
          alt=""
          loading="lazy"
          sx={{ aspectRatio: "2/3", objectFit: "cover" }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.4), rgba(0,0,0,0) 200px), linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0) 300px)",
          }}
        />
        <CardContent
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            height: 70,
          }}
        >
          <Typography variant="subtitle1" color="#fff" noWrap>
            {stream.name}
          </Typography>
          <Typography variant="body2" sx={{ color: "grey.400" }}>
            {stream.rating}/10
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
