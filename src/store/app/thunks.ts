import { createAsyncThunk } from "@reduxjs/toolkit"
import {
  XtremeCodesConfig,
  AccountInfo,
} from "../../services/XtremeCodesAPI.types"
import { localStorageGet } from "../../services/utils"
import { STORAGE_KEY } from "../../services/constants"
import { XtremeCodesAPI } from "../../services/XtremeCodesAPI"
import { RootState } from "../store"
import { loadSeriesFromLocalStorageAsync } from "../series/seriesSlice"
import { loadVodFromLocalStorageAsync } from "../vod/vodSlice"
import {
  loadFavoritesAsync,
  loadLiveFromLocalStorageAsync,
} from "../live/liveSlice"
import { loadWatchlistAsync } from "../watchlist/watchlistSlice"

export const loadApp = createAsyncThunk<
  {
    apiConfig: XtremeCodesConfig
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
  }> => {
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
      thunkAPI.dispatch(loadSeriesFromLocalStorageAsync()),
      thunkAPI.dispatch(loadVodFromLocalStorageAsync()),
      thunkAPI.dispatch(loadLiveFromLocalStorageAsync()),
      thunkAPI.dispatch(loadFavoritesAsync()),
    ])

    return {
      apiConfig: config,
    }
  },
)

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
