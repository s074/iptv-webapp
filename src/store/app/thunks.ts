import { createAsyncThunk } from "@reduxjs/toolkit"
import {
  XtremeCodesConfig,
  AccountInfo,
} from "../../services/XtremeCodesAPI.types"
import {
  deleteAccountFromLocalStorage,
  localStorageGet,
} from "../../services/utils"
import { STORAGE_KEY } from "../../services/constants"
import { XtremeCodesAPI } from "../../services/XtremeCodesAPI"
import { RootState } from "../store"
import { loadSeriesFromLocalStorageAsync, setSeriesCategories, setSeriesStreams } from "../series/seriesSlice"
import { loadVodFromLocalStorageAsync, setVodCategories, setVodStreams } from "../vod/vodSlice"
import {
  loadFavoritesAsync,
  loadLiveFromLocalStorageAsync,
  setLiveCategories,
  setLiveStreams,
} from "../live/liveSlice"
import { loadWatchlistAsync } from "../watchlist/watchlistSlice"
import { loadHiddenCategoriesAsync } from "../hiddenCategories/hiddenCategoriesSlice"
import { MediaSource } from "../types"
import { Category, LiveStream } from "../../services/XtremeCodesAPI.types"
import { hydrateEpgOffsets } from "../../services/epgTime"

export const loadApp = createAsyncThunk<
  {
    apiConfig: XtremeCodesConfig
    mediaSource: MediaSource
  },
  void,
  { state: RootState }
>(
  "load",
  async (
    _,
    thunkAPI,
  ): Promise<{
    apiConfig: XtremeCodesConfig
    mediaSource: MediaSource
  }> => {
    // EPG corrections apply to every session type — load before ready.
    await hydrateEpgOffsets()

    const mediaSourceStr = await localStorageGet(STORAGE_KEY.MEDIA_SOURCE)

    if (mediaSourceStr) {
      const mediaSource = JSON.parse(mediaSourceStr) as MediaSource
      if (mediaSource.kind === "m3u") {
        return loadM3USource(thunkAPI, mediaSource)
      }
      // kind "xtream" → fall through to the credential flow below
    }

    const apiConfig = await localStorageGet(STORAGE_KEY.API_CONFIG)

    if (!apiConfig) return Promise.reject("no stored login found")

    const config = JSON.parse(apiConfig) as XtremeCodesConfig

    if (
      ![config.auth.username, config.auth.password, config.baseUrl].every(
        Boolean,
      )
    ) {
      return Promise.reject("empty login details")
    }

    // check if stored login details are valid
    try {
      await thunkAPI.dispatch(fetchAccountInfo({ config })).unwrap()
    } catch (e) {
      return Promise.reject("stored login no longer valid")
    }

    // Hydrate all slices in parallel. Best-effort (allSettled): a corrupt
    // local cache must never log the user out. `ready` is only set once
    // this completes, so the loading screen covers the full load.
    await Promise.allSettled([
      thunkAPI.dispatch(loadWatchlistAsync()),
      thunkAPI.dispatch(loadHiddenCategoriesAsync()),
      thunkAPI.dispatch(loadSeriesFromLocalStorageAsync()),
      thunkAPI.dispatch(loadVodFromLocalStorageAsync()),
      thunkAPI.dispatch(loadLiveFromLocalStorageAsync()),
      thunkAPI.dispatch(loadFavoritesAsync()),
    ])

    return {
      apiConfig: config,
      mediaSource: { kind: "xtream" },
    }
  },
)

/**
 * M3U cold start: no network, channels/categories come from the stored
 * parse. VOD/series slices are explicitly cleared so a previous Xtream
 * session in the same tab can't leak through.
 */
async function loadM3USource(
  thunkAPI: {
    dispatch: (action: any) => any
    getState: () => RootState
  },
  mediaSource: Extract<MediaSource, { kind: "m3u" }>,
): Promise<{ apiConfig: XtremeCodesConfig; mediaSource: MediaSource }> {
  const [channelsStr, categoriesStr] = await Promise.all([
    localStorageGet(STORAGE_KEY.M3U_CHANNELS),
    localStorageGet(STORAGE_KEY.M3U_CATEGORIES),
  ])

  if (!channelsStr || !categoriesStr) {
    return Promise.reject("stored playlist missing")
  }

  const channels = JSON.parse(channelsStr) as LiveStream[]
  const categories = JSON.parse(categoriesStr) as Category[]

  if (
    !Array.isArray(channels) ||
    channels.length === 0 ||
    !Array.isArray(categories)
  ) {
    return Promise.reject("stored playlist empty")
  }

  thunkAPI.dispatch(setLiveCategories(categories))
  thunkAPI.dispatch(setLiveStreams(channels))
  thunkAPI.dispatch(setSeriesCategories([]))
  thunkAPI.dispatch(setSeriesStreams([]))
  thunkAPI.dispatch(setVodCategories([]))
  thunkAPI.dispatch(setVodStreams([]))

  await Promise.allSettled([
    thunkAPI.dispatch(loadWatchlistAsync()),
    thunkAPI.dispatch(loadHiddenCategoriesAsync()),
    thunkAPI.dispatch(loadFavoritesAsync()),
  ])

  return {
    apiConfig: { baseUrl: "", auth: { username: "", password: "" } },
    mediaSource,
  }
}

export const fetchAccountInfo = createAsyncThunk<
  AccountInfo,
  { config?: XtremeCodesConfig },
  { state: RootState }
>(
  "fetchAccountInfo",
  async (
    arg: { config?: XtremeCodesConfig },
    thunkAPI,
  ): Promise<AccountInfo> => {
    const apiConfig = arg.config ?? thunkAPI.getState().app.apiConfig

    return await XtremeCodesAPI.getAccountInfo(apiConfig)
  },
)

export const removeAccount = createAsyncThunk<void, void, { state: RootState }>(
  "removeAccount",
  async () => {
    await deleteAccountFromLocalStorage()
  },
)
