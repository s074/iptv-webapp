import Box from "@mui/material/Box"
import IconButton from "@mui/material/IconButton"
import { AppThemeProvider } from "./theme"
import Layout from "./components/layout/Layout"
import { ColorSchemeToggle } from "./components/common/ColorSchemeToggle"
import { useEffect, useState } from "react"
import {
  NavigatorHeader,
  NavigatorSidebar,
} from "./components/layout/Navigator"
import { Route, Routes } from "react-router-dom"
import { urls } from "./services/urls"
import { Dashboard } from "./pages/Dashboard"
import { LiveTV } from "./pages/LiveTV"
import { selectAppStatus } from "./store/app/selector"
import { loadApp } from "./store/app/thunks"
import { useAppDispatch, useAppSelector } from "./store/hooks"
import { Login } from "./components/login/Login"
import { Loading } from "./components/layout/Loading"
import { Movies } from "./pages/Movies"
import { WatchMovie } from "./pages/movies/WatchMovie"
import { TVSeries } from "./pages/TVSeries"
import { WatchSeries } from "./pages/shows/WatchSeries"
import { SearchInput } from "./components/SearchInput"
import { SearchResults } from "./pages/SearchResults"
import { Watchlist } from "./pages/Watchlist"
import { Settings } from "./pages/Settings"

import GroupRoundedIcon from "@mui/icons-material/GroupRounded"
import MenuIcon from "@mui/icons-material/Menu"

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const status = useAppSelector(selectAppStatus)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (status === "needsLoad") {
      // loadApp validates the stored login, hydrates every slice in
      // parallel, and only then flips status to "ready" , the loading
      // screen covers the whole sequence.
      dispatch(loadApp())
        .unwrap()
        .catch(() => {
          console.log("Failed to load app")
        })
    }
  }, [dispatch, status])

  return (
    <AppThemeProvider>
      {status === "needsAuth" && <Login />}
      {status === "needsLoad" && <Loading />}
      {status === "ready" && (
        <>
          {drawerOpen && (
            <Layout.SideDrawer onClose={() => setDrawerOpen(false)}>
              <NavigatorSidebar />
            </Layout.SideDrawer>
          )}
          <Layout.Root
            sx={{
              ...(drawerOpen && {
                height: "100vh",
                overflow: "hidden",
              }),
            }}
          >
            <Layout.Header>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => setDrawerOpen(true)}
                  sx={{ display: { md: "none" } }}
                >
                  <MenuIcon />
                </IconButton>
                <NavigatorHeader />
              </Box>
              <SearchInput />
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <ColorSchemeToggle />
              </Box>
            </Layout.Header>
            <Layout.Main>
              <Routes>
                <Route path={urls.home} element={<Dashboard />} />
                <Route path={urls.liveTv} element={<LiveTV />} />
                <Route path={urls.movies} element={<Movies />} />
                <Route path={urls.movieWatch} element={<WatchMovie />} />
                <Route path={urls.tvShows} element={<TVSeries />} />
                <Route path={urls.seriesWatch} element={<WatchSeries />} />
                <Route path={urls.search} element={<SearchResults />} />
                <Route path={urls.watchlist} element={<Watchlist />} />
                <Route path={urls.settings} element={<Settings />} />
              </Routes>
            </Layout.Main>
          </Layout.Root>
        </>
      )}
    </AppThemeProvider>
  )
}

export default App
