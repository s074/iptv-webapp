import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import {
  Category,
  LiveStream,
  SeriesStream,
  VodStream,
  XtremeCodesConfig,
  AccountInfo,
} from "../../services/XtremeCodesAPI.types"
import {
  fetchAccountInfo,
  fetchLiveStreamCategories,
  fetchLiveStreams,
  fetchSeriesStreamCategories,
  fetchSeriesStreams,
  fetchVODStreamCategories,
  fetchVODStreams,
  loadApp,
  loadFavorites,
  loadWatchlist,
} from "./thunks"
import {
  deleteAccountFromLocalStorage,
  localStorageSet,
} from "../../services/utils"
import { STORAGE_KEY } from "../../services/constants"
import { WatchlistItem } from "../types"

export interface AppState {
  status: "needsLoad" | "needsAuth" | "ready"
  apiConfig: XtremeCodesConfig
  accountInfo: AccountInfo
  lastFetchedAccountInfo: number
  vodCategories: Category[]
  liveCategories: Category[]
  seriesCategories: Category[]
  liveStreams: LiveStream[]
  vodStreams: VodStream[]
  seriesStreams: SeriesStream[]
  watchlist: WatchlistItem[]
  favorites: LiveStream[]
}

const initialState: AppState = {
  status: "needsLoad",
  apiConfig: { baseUrl: "", auth: { username: "", password: "" } },
  accountInfo: {},
  lastFetchedAccountInfo: 0,
  vodCategories: [],
  liveCategories: [],
  seriesCategories: [],
  liveStreams: [],
  vodStreams: [],
  seriesStreams: [],
  watchlist: [],
  favorites: [],
}

export const appSlice = createSlice({
  name: "app",
  initialState: initialState,
  reducers: {
    setApiConfig: (state, action: PayloadAction<XtremeCodesConfig>) => {
      state.apiConfig = action.payload
      localStorageSet(
        STORAGE_KEY.API_CONFIG,
        JSON.stringify(state.apiConfig),
      ).catch(console.error)
    },
    setAppStatus: (
      state,
      action: PayloadAction<"needsLoad" | "needsAuth" | "ready">,
    ) => {
      state.status = action.payload
    },
    removeAccount: (state) => {
      deleteAccountFromLocalStorage()
      state.status = "needsAuth"
    },
    addToWatchlist: (state, action: PayloadAction<WatchlistItem>) => {
      state.watchlist.push(action.payload)
      localStorageSet(
        STORAGE_KEY.WATCHLIST,
        JSON.stringify(state.watchlist),
      ).catch(console.error)
    },
    removeFromWatchlist: (state, action: PayloadAction<WatchlistItem>) => {
      const index = state.watchlist.findIndex(
        (element) =>
          element.id === action.payload.id &&
          element.type === action.payload.type,
      )
      state.watchlist.splice(index, 1)
      localStorageSet(
        STORAGE_KEY.WATCHLIST,
        JSON.stringify(state.watchlist),
      ).catch(console.error)
    },
    addToFavorites: (state, action: PayloadAction<LiveStream>) => {
      state.favorites.push(action.payload)
      localStorageSet(
        STORAGE_KEY.FAVORITES,
        JSON.stringify(state.favorites),
      ).catch(console.error)
    },
    removeFromFavorites: (state, action: PayloadAction<LiveStream>) => {
      const index = state.favorites.findIndex(
        (element) => element.stream_id === action.payload.stream_id,
      )
      state.favorites.splice(index, 1)
      localStorageSet(
        STORAGE_KEY.FAVORITES,
        JSON.stringify(state.favorites),
      ).catch(console.error)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadApp.fulfilled, (state, action) => {
        state.apiConfig = action.payload.apiConfig
        state.liveCategories = action.payload.liveCategories
        state.vodCategories = action.payload.vodCategories
        state.seriesCategories = action.payload.seriesCategories
        state.liveStreams = action.payload.liveStreams
        state.vodStreams = action.payload.vodStreams
        state.seriesStreams = action.payload.seriesStreams
        state.status = "ready"
      })
      .addCase(loadApp.rejected, (state, action) => {
        state.status = "needsAuth"
        console.log(action.error)
      })
      .addCase(loadWatchlist.fulfilled, (state, action) => {
        state.watchlist = action.payload
      })
      .addCase(loadFavorites.fulfilled, (state, action) => {
        state.favorites = action.payload
      })
      .addCase(fetchAccountInfo.fulfilled, (state, action) => {
        state.accountInfo = action.payload
        state.lastFetchedAccountInfo = Date.now()
      })
      .addCase(fetchLiveStreamCategories.fulfilled, (state, action) => {
        state.liveCategories = action.payload

        localStorageSet(
          STORAGE_KEY.LIVE_CATEGORIES,
          JSON.stringify(state.liveCategories),
        ).catch(console.error)
      })
      .addCase(fetchVODStreamCategories.fulfilled, (state, action) => {
        state.vodCategories = action.payload

        localStorageSet(
          STORAGE_KEY.VOD_CATEGORIES,
          JSON.stringify(state.vodCategories),
        ).catch(console.error)
      })
      .addCase(fetchSeriesStreamCategories.fulfilled, (state, action) => {
        state.seriesCategories = action.payload

        localStorageSet(
          STORAGE_KEY.SERIES_CATEGORIES,
          JSON.stringify(state.seriesCategories),
        ).catch(console.error)
      })
      .addCase(fetchLiveStreams.fulfilled, (state, action) => {
        state.liveStreams = action.payload

        localStorageSet(
          STORAGE_KEY.LIVE_STREAMS,
          JSON.stringify(state.liveStreams),
        ).catch(console.error)
      })
      .addCase(fetchVODStreams.fulfilled, (state, action) => {
        state.vodStreams = action.payload

        localStorageSet(
          STORAGE_KEY.VOD_STREAMS,
          JSON.stringify(state.vodStreams),
        ).catch(console.error)
      })
      .addCase(fetchSeriesStreams.fulfilled, (state, action) => {
        state.seriesStreams = action.payload

        localStorageSet(
          STORAGE_KEY.SERIES_STREAMS,
          JSON.stringify(state.seriesStreams),
        ).catch(console.error)
      })
  },
})

export const {
  setApiConfig,
  setAppStatus,
  removeFromWatchlist,
  addToWatchlist,
  removeAccount,
  addToFavorites,
  removeFromFavorites,
} = appSlice.actions

export default appSlice.reducer
