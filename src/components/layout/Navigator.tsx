import IconButton from "@mui/material/IconButton"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemIcon from "@mui/material/ListItemIcon"
import ListItemText from "@mui/material/ListItemText"
import ListSubheader from "@mui/material/ListSubheader"
import { FC } from "react"
import { urls } from "../../services/urls"
import { useLocation } from "react-router-dom"
import { useNavigate } from "react-router-dom"

import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"
import HomeIcon from "@mui/icons-material/Home"
import LiveTvIcon from "@mui/icons-material/LiveTv"
import TheatersIcon from "@mui/icons-material/Theaters"
import TvIcon from "@mui/icons-material/Tv"
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder"

export const navigationItems = [
  {
    url: urls.home,
    icon: <HomeIcon fontSize="small" />,
    text: "Dashboard",
  },
  {
    url: urls.liveTv,
    icon: <LiveTvIcon fontSize="small" />,
    text: "Live TV",
  },
  {
    url: urls.movies,
    icon: <TheatersIcon fontSize="small" />,
    text: "Movies",
  },
  {
    url: urls.tvShows,
    icon: <TvIcon fontSize="small" />,
    text: "TV Shows",
  },
  {
    url: urls.watchlist,
    icon: <BookmarkBorderIcon fontSize="small" />,
    text: "Watchlist",
  },
]

export const NavigatorSidebar: FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <List dense sx={{ width: "100%", maxWidth: 300 }}>
      <ListSubheader
        sx={{
          display: "flex",
          alignItems: "center",
          bgcolor: "transparent",
        }}
      >
        Browse
        <IconButton
          size="small"
          color="primary"
          sx={{ ml: "auto" }}
          aria-label="collapse browse menu"
        >
          <KeyboardArrowDownRoundedIcon fontSize="small" color="primary" />
        </IconButton>
      </ListSubheader>
      {navigationItems.map((item) => (
        <ListItem key={item.url} disablePadding>
          <ListItemButton
            selected={location.pathname === item.url}
            onClick={() => navigate(item.url)}
            sx={{ borderRadius: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  )
}

export const NavigatorHeader: FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <List
      sx={{
        display: { xs: "none", sm: "none", md: "flex" },
        flexDirection: "row",
        gap: 1,
        p: 0.5,
      }}
    >
      {navigationItems.map((item) => (
        <ListItem key={item.url} disablePadding sx={{ width: "auto" }}>
          <ListItemButton
            selected={location.pathname === item.url}
            onClick={() => navigate(item.url)}
            sx={{ borderRadius: 2, whiteSpace: "nowrap" }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  )
}
