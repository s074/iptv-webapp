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
import ButtonGroup from "@mui/material/ButtonGroup"
import Grid from "@mui/material/Grid"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import Typography from "@mui/material/Typography"
import { ArrowDropDown } from "@mui/icons-material"
import { EpisodesCarousel } from "./EpisodesCarousel"
import { selectWatchlist, addToWatchlist, removeFromWatchlist } from "../store/watchlist/watchlistSlice"
import { useEpisodeUrl } from "./useMediaUrl"
import { copyTextToClibpboard } from "../services/utils"
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
    // some providers send faulty API data with an empty seasons array
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

  if (state === "loading") return <Loading />

  return (
    <Grid
      container
      spacing={1}
      sx={{
        flexGrow: 1,
        justifyContent: "center",
        marginTop: 5,
      }}
    >
      <Grid size={{ xs: 12, md: 5 }} sx={{ justifyContent: "center", alignContent: "center" }}>
        <Box
          component="img"
          src={series.cover}
          alt=""
          sx={{ width: "100%", objectFit: "contain" }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 7 }}>
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
            <ButtonGroup sx={{ margin: 5 }} variant="contained">
              <Button
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
              <Button color="primary" onClick={toggleWatchlist}>
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
                  color="inherit"
                  onClick={() => onClickCopy()}
                >
                  {`Copy S${selectedSeason?.season_number}E${selectedEpisode?.episode_num} Video Url`}
                </Button>
              )}
            </ButtonGroup>
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
