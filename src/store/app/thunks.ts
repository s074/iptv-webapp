import { createAsyncThunk } from "@reduxjs/toolkit"
import {
  Category,
  LiveStream,
  SeriesStream,
  VodStream,
  XtremeCodesConfig,
  AccountInfo,
  VodInfo,
  SeriesInfo,
  LiveStreamEPG,
} from "../../services/XtremeCodesAPI.types"
import { localStorageGet } from "../../services/utils"
import { STORAGE_KEY } from "../../services/constants"
import { XtremeCodesAPI } from "../../services/XtremeCodesAPI"
import { RootState } from "../store"
import { WatchlistItem } from "../types"

export const loadApp = createAsyncThunk<
  {
    apiConfig: XtremeCodesConfig
    liveCategories: Category[]
    vodCategories: Category[]
    seriesCategories: Category[]
    liveStreams: LiveStream[]
    vodStreams: VodStream[]
    seriesStreams: SeriesStream[]
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
    liveCategories: Category[]
    vodCategories: Category[]
    seriesCategories: Category[]
    liveStreams: LiveStream[]
    vodStreams: VodStream[]
    seriesStreams: SeriesStream[]
  }> => {
    thunkAPI.dispatch(loadWatchlist())

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

    const liveCategoriesStr = await localStorageGet(STORAGE_KEY.LIVE_CATEGORIES)
    const liveCategories = liveCategoriesStr
      ? (JSON.parse(liveCategoriesStr) as Category[])
      : []
    const vodCategoriesStr = await localStorageGet(STORAGE_KEY.VOD_CATEGORIES)
    const vodCategories = vodCategoriesStr
      ? (JSON.parse(vodCategoriesStr) as Category[])
      : []
    const seriesCategoriesStr = await localStorageGet(
      STORAGE_KEY.SERIES_CATEGORIES,
    )
    const seriesCategories = seriesCategoriesStr
      ? (JSON.parse(seriesCategoriesStr) as Category[])
      : []

    const liveStreamsStr = await localStorageGet(STORAGE_KEY.LIVE_STREAMS)
    const liveStreams = liveStreamsStr
      ? (JSON.parse(liveStreamsStr) as LiveStream[])
      : []
    const vodStreamsStr = await localStorageGet(STORAGE_KEY.VOD_STREAMS)
    const vodStreams = vodStreamsStr
      ? (JSON.parse(vodStreamsStr) as VodStream[])
      : []
    const seriesStreamsStr = await localStorageGet(STORAGE_KEY.SERIES_STREAMS)
    const seriesStreams = seriesStreamsStr
      ? (JSON.parse(seriesStreamsStr) as SeriesStream[])
      : []

    return {
      apiConfig: config,
      liveCategories,
      vodCategories,
      seriesCategories,
      liveStreams,
      vodStreams,
      seriesStreams,
    }
  },
)

export const loadWatchlist = createAsyncThunk<
  WatchlistItem[],
  void,
  { state: RootState }
>("loadWatchlist", async (_, thunkAPI): Promise<WatchlistItem[]> => {
  const watchlistStr = await localStorageGet(STORAGE_KEY.WATCHLIST)
  const watchlist = watchlistStr
    ? (JSON.parse(watchlistStr) as WatchlistItem[])
    : []

  return watchlist
})

export const loadFavorites = createAsyncThunk<
  LiveStream[],
  void,
  { state: RootState }
>("loadFavorites", async (_, thunkAPI): Promise<LiveStream[]> => {
  const favoritesStr = await localStorageGet(STORAGE_KEY.FAVORITES)
  const favorites = favoritesStr
    ? (JSON.parse(favoritesStr) as LiveStream[])
    : []

  return favorites
})

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

export const fetchLiveStreamCategories = createAsyncThunk<
  Category[],
  void,
  { state: RootState }
>("fetchLiveStreamCategories", async (_, thunkAPI): Promise<Category[]> => {
  const state = thunkAPI.getState()

  const config = state.app.apiConfig

  if (
    ![config.auth.username, config.auth.password, config.baseUrl].every(Boolean)
  ) {
    return Promise.reject("no api config")
  }

  return await XtremeCodesAPI.getLiveStreamCategories(config)
})

export const fetchVODStreamCategories = createAsyncThunk<
  Category[],
  void,
  { state: RootState }
>("fetchVODStreamCategories", async (_, thunkAPI): Promise<Category[]> => {
  const state = thunkAPI.getState()

  const config = state.app.apiConfig

  if (
    ![config.auth.username, config.auth.password, config.baseUrl].every(Boolean)
  ) {
    return Promise.reject("no api config")
  }

  return await XtremeCodesAPI.getVODStreamCategories(config)
})

export const fetchSeriesStreamCategories = createAsyncThunk<
  Category[],
  void,
  { state: RootState }
>("fetchSeriesStreamCategories", async (_, thunkAPI): Promise<Category[]> => {
  const state = thunkAPI.getState()

  const config = state.app.apiConfig

  if (
    ![config.auth.username, config.auth.password, config.baseUrl].every(Boolean)
  ) {
    return Promise.reject("no api config")
  }

  return await XtremeCodesAPI.getSeriesStreamCategories(config)
})

export const fetchSeriesStreams = createAsyncThunk<
  SeriesStream[],
  void,
  { state: RootState }
>("fetchSeriesStreams", async (_, thunkAPI): Promise<SeriesStream[]> => {
  const state = thunkAPI.getState()

  const config = state.app.apiConfig

  if (
    ![config.auth.username, config.auth.password, config.baseUrl].every(Boolean)
  ) {
    return Promise.reject("no api config")
  }

  return await XtremeCodesAPI.getSeriesStreams(config)
})

export const fetchVODStreams = createAsyncThunk<
  VodStream[],
  void,
  { state: RootState }
>("fetchVODStreams", async (_, thunkAPI): Promise<VodStream[]> => {
  const state = thunkAPI.getState()

  const config = state.app.apiConfig

  if (
    ![config.auth.username, config.auth.password, config.baseUrl].every(Boolean)
  ) {
    return Promise.reject("no api config")
  }

  return await XtremeCodesAPI.getVODStreams(config)
})

export const fetchLiveStreams = createAsyncThunk<
  LiveStream[],
  void,
  { state: RootState }
>("fetchLiveStreams", async (_, thunkAPI): Promise<LiveStream[]> => {
  const state = thunkAPI.getState()

  const config = state.app.apiConfig

  if (
    ![config.auth.username, config.auth.password, config.baseUrl].every(Boolean)
  ) {
    return Promise.reject("no api config")
  }

  return await XtremeCodesAPI.getLiveStreams(config)
})

export const fetchVODInfo = createAsyncThunk<
  VodInfo,
  { vodId: number },
  { state: RootState }
>(
  "fetchVODInfo",
  async (arg: { vodId: number }, thunkAPI): Promise<VodInfo> => {
    const state = thunkAPI.getState()

    const config = state.app.apiConfig

    if (
      ![config.auth.username, config.auth.password, config.baseUrl].every(
        Boolean,
      )
    ) {
      return Promise.reject("no api config")
    }

    return await XtremeCodesAPI.getVODInfo(config, arg.vodId)
  },
)

export const fetchSeriesInfo = createAsyncThunk<
  SeriesInfo,
  { seriesId: number },
  { state: RootState }
>(
  "fetchSeriesInfo",
  async (arg: { seriesId: number }, thunkAPI): Promise<SeriesInfo> => {
    const state = thunkAPI.getState()

    const config = state.app.apiConfig

    if (
      ![config.auth.username, config.auth.password, config.baseUrl].every(
        Boolean,
      )
    ) {
      return Promise.reject("no api config")
    }

    return await XtremeCodesAPI.getSeriesInfo(config, arg.seriesId)
  },
)

export const fetchShortEpg = createAsyncThunk<
  LiveStreamEPG,
  { channelId: number; limit: number },
  { state: RootState }
>(
  "fetchShortEpg",
  async (
    arg: { channelId: number; limit: number },
    thunkAPI,
  ): Promise<LiveStreamEPG> => {
    const state = thunkAPI.getState()

    const config = state.app.apiConfig

    if (
      ![config.auth.username, config.auth.password, config.baseUrl].every(
        Boolean,
      )
    ) {
      return Promise.reject("no api config")
    }

    return await XtremeCodesAPI.getEPGForLiveStream(
      config,
      arg.channelId,
      arg.limit,
    )
  },
)
