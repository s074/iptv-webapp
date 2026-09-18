import { FC, useCallback, useEffect, useState } from "react"
import {
  SeriesEpisode,
  SeriesInfo,
  SeriesSeason,
  SeriesStream,
} from "../services/XtremeCodesAPI.types"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { Loading } from "./layout/Loading"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Grid from "@mui/material/Grid"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import Typography from "@mui/material/Typography"
import { ArrowDropDown } from "@mui/icons-material"
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded"
import { EpisodesCarousel } from "./EpisodesCarousel"
import { YoutubeVideo } from "./YoutubeVideo"
import { MediaSpecs } from "./MediaSpecs"
import { selectWatchlist, addToWatchlist, removeFromWatchlist } from "../store/watchlist/watchlistSlice"
import { useEpisodeUrl } from "./useMediaUrl"
import { copyTextToClibpboard, isVlcPlatform, openInVlc } from "../services/utils"
import { fetchSeriesInfoAsync } from "../store/series/seriesSlice"

export interface SeriesInfoProps {
  series: SeriesStream
  playButton?: JSX.Element
  selectedEpisode?: SeriesEpisode
  onSelectEpisode?: (episode: SeriesEpisode) => void
}

export const SeriesInfoComponent: FC<SeriesInfoProps> = (props) => {
  const { series, onSelectEpisode, playButton, selectedEpisode } = props
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")
  const [info, setInfo] = useState<SeriesInfo | undefined>(undefined)
  const [selectedSeason, setSelectedSeason] = useState<
    SeriesSeason | undefined
  >(undefined)
  const [seasonAnchor, setSeasonAnchor] = useState<HTMLElement | null>(null)
  const [trailerVisible, setTrailerVisible] = useState(false)
  const dispatch = useAppDispatch()
  const watchlist = useAppSelector(selectWatchlist)
  const url = useEpisodeUrl(
    selectedEpisode?.id ?? 0,
    selectedEpisode?.container_extension ?? "",
  )

  useEffect(() => {
    if (!series || !series.series_id) return

    dispatch(fetchSeriesInfoAsync({ seriesId: series.series_id }))
      .unwrap()
      .then((info) => {
        setInfo(info)
        setState("ready")
        console.log(info)
      })
      .catch((e) => {
        console.log(e)
        setState("error")
      })
  }, [dispatch, series])

  const onEpisodeClick = (episode: SeriesEpisode) => {
    if (onSelectEpisode) onSelectEpisode(episode)
  }

  const toggleWatchlist = () => {
    if (series.series_id === undefined) return

    if (
      watchlist.find(
        (element) =>
          element.id === series.series_id && element.type === "series",
      )
    ) {
      dispatch(removeFromWatchlist({ id: series.series_id, type: "series" }))
    } else {
      dispatch(addToWatchlist({ id: series.series_id, type: "series" }))
    }
  }

  const seasons = useCallback(() => {
    // some backends send faulty API data with an empty seasons array
    // so we have to compensate
    const seasons: SeriesSeason[] = []

    if (!info) return seasons

    if (info.seasons && info.seasons.length > 0) return info.seasons

    if (!info.episodes) return seasons

    const seasonIds = Object.keys(info.episodes)

    for (const seasonId of seasonIds) {
      seasons.push({
        season_number: Number(seasonId),
        episode_count: info.episodes[seasonId].length,
        name: `Season ${seasonId}`,
      })
    }

    return seasons
  }, [info])

  useEffect(() => {
    const firstSeason = seasons().find(
      (value) => value.season_number !== undefined,
    )
    setSelectedSeason(firstSeason)
  }, [seasons])

  const onClickCopy = async () => {
    await copyTextToClibpboard(url)
  }

  const showTrailer = trailerVisible && info?.info?.youtube_trailer

  if (state === "loading") return <Loading />

  return (
    <Grid
      container
      spacing={2}
      sx={{
        flexGrow: 1,
        justifyContent: "center",
        marginTop: 1,
      }}
    >
      <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
        {showTrailer && <YoutubeVideo id={info?.info?.youtube_trailer ?? ""} />}
        {!showTrailer && (
        <Box
          component="img"
          src={series.cover}
          alt=""
          sx={{
            width: "100%",
            maxWidth: { xs: 200, md: 260 },
            objectFit: "contain",
            borderRadius: 2,
          }}
        />
        )}
      </Grid>
      <Grid size={{ xs: 12, md: 8 }} sx={{ minWidth: 0 }}>
        {state === "ready" && (
          <div style={{ justifyContent: "center" }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {info?.info?.plot}
            </Typography>
            <Typography>
              <b>Release Date:</b> {info?.info?.releaseDate}
            </Typography>
            <Typography>
              <b>Episode Duration:</b> {info?.info?.episode_run_time}
            </Typography>
            <Typography>
              <b>Genre:</b> {info?.info?.genre}
            </Typography>
            <Typography>
              <b>Directed By:</b> {info?.info?.director}
            </Typography>
            <Typography>
              <b>Cast:</b> {info?.info?.cast}
            </Typography>
            {selectedEpisode && (
              <MediaSpecs
                container={selectedEpisode.container_extension}
                video={selectedEpisode.info?.video}
                audio={selectedEpisode.info?.audio}
                durationSecs={selectedEpisode.info?.duration_secs}
                duration={selectedEpisode.info?.duration}
                heading={`Episode quality (S${selectedEpisode.season} E${selectedEpisode.episode_num})`}
              />
            )}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
              <Button
                variant="contained"
                color="inherit"
                onClick={() => setTrailerVisible((prev) => !prev)}
                disabled={!info || !info.info?.youtube_trailer}
              >
                Watch Trailer
              </Button>
              <Button
                variant="contained"
                color="inherit"
                endIcon={<ArrowDropDown />}
                onClick={(e) => setSeasonAnchor(e.currentTarget)}
              >
                <>Season {selectedSeason?.season_number}</>
              </Button>
              <Menu
                open={Boolean(seasonAnchor)}
                anchorEl={seasonAnchor}
                onClose={() => setSeasonAnchor(null)}
                sx={{ zIndex: 9999 }}
              >
                {seasons().map((season) => (
                  <MenuItem
                    key={season.season_number}
                    sx={{ justifyContent: "center" }}
                    selected={selectedSeason === season}
                    onClick={() => {
                      setSelectedSeason(season)
                      setSeasonAnchor(null)
                    }}
                  >
                    {season.season_number}
                  </MenuItem>
                ))}
              </Menu>
              <Button variant="contained" color="primary" onClick={toggleWatchlist}>
                {watchlist.find(
                  (element) =>
                    element.id === series.series_id &&
                    element.type === "series",
                )
                  ? "Remove from Watchlist"
                  : "Add to Watchlist"}
              </Button>
              {playButton !== undefined && playButton}
              {selectedEpisode && (
                <Button
                  variant="contained"
                  color="inherit"
                  onClick={() => onClickCopy()}
                >
                  {`Copy S${selectedSeason?.season_number}E${selectedEpisode?.episode_num} Video Url`}
                </Button>
              )}
              {selectedEpisode && isVlcPlatform() && (
                <Button
                  variant="contained"
                  color="inherit"
                  startIcon={<OpenInNewRoundedIcon />}
                  onClick={() => openInVlc(url)}
                >
                  Open in VLC
                </Button>
              )}
            </Box>
          </div>
        )}
      </Grid>
      <Grid
        size={{ xs: 12 }}
        sx={{ justifyContent: "center", alignContent: "center" }}
      >
        {state === "ready" && info?.episodes && selectedSeason && (
          <>
            <Typography
              component="h3"
              variant="h6"
              align="center"
              sx={{ display: "flex", justifyContent: "center" }}
            >
              Episodes
            </Typography>
            <EpisodesCarousel
              episodes={
                info?.episodes[
                  selectedSeason.season_number?.toString() ?? "1"
                ] ?? []
              }
              onEpisodeClick={onEpisodeClick}
              activeEpisode={selectedEpisode}
            />
          </>
        )}
      </Grid>
      {selectedEpisode && (
        <Grid size={{ xs: 12 }}>
          <Typography
            component="h3"
            variant="h6"
            align="center"
            sx={{ display: "flex", justifyContent: "center" }}
          >
            S{selectedEpisode.season}:E{selectedEpisode.episode_num} Plot
          </Typography>
          <Typography>{selectedEpisode.info?.plot}</Typography>
        </Grid>
      )}
    </Grid>
  )
}
