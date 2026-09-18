import { PayloadAction } from "@reduxjs/toolkit";
import { createAppSlice } from "../app/createAppSlice";
import { Category, LiveStream, LiveStreamEPGItem } from "../../services/XtremeCodesAPI.types";
import { localStorageGet, localStorageSet } from "../../services/utils";
import { STORAGE_KEY } from "../../services/constants";
import { XtremeCodesAPI } from "../../services/XtremeCodesAPI";
import { m3uToLiveChannels, parseM3U } from "../../services/m3u";
import { fetchExternalEpg, xmltvToListings } from "../../services/externalEpg";
import { XTREAM_BULK_SOURCE_ID, extEpgSourceId } from "../../services/epgTime";
import { RootState } from "../store";

export interface LiveTvState {
    liveCategories: Category[]
    liveStreams: LiveStream[]
    favorites: LiveStream[]
    // External XMLTV guides: payloads are session-scoped by design, keyed
    // by source URL so removing one guide drops exactly its listings.
    // Only the URL list is persisted (see services/externalEpg.ts).
    externalEpg: Record<string, Record<string, LiveStreamEPGItem[]>>
    externalEpgStatus: "idle" | "loading" | "ready" | "error"
    externalEpgError?: string
    // Provider bulk guide (xmltv.php): one download replaces per-stream
    // short_epg requests. Session-scoped, never persisted.
    bulkEpg: Record<string, LiveStreamEPGItem[]>
    bulkEpgStatus: "idle" | "loading" | "ready" | "error"
    bulkEpgError?: string
}

const initialState: LiveTvState = {
    liveCategories: [],
    liveStreams: [],
    favorites: [],
    externalEpg: {},
    externalEpgStatus: "idle",
    externalEpgError: undefined,
    bulkEpg: {},
    bulkEpgStatus: "idle",
    bulkEpgError: undefined,
}

export const liveSlice = createAppSlice({
    name: "live",
    initialState,
    reducers: create => ({
        setLiveCategories: create.reducer((state, action: PayloadAction<Category[]>) => {
            state.liveCategories = action.payload
        }),
        setLiveStreams: create.reducer((state, action: PayloadAction<LiveStream[]>) => {
            state.liveStreams = action.payload
        }),
        loadLiveFromLocalStorageAsync: create.asyncThunk(
            async () => {
                const liveCategoriesStr = await localStorageGet(STORAGE_KEY.LIVE_CATEGORIES)
                const liveCategories = liveCategoriesStr
                ? (JSON.parse(liveCategoriesStr) as Category[])
                : []
                const liveStreamsStr = await localStorageGet(STORAGE_KEY.LIVE_STREAMS)
                const liveStreams = liveStreamsStr
                ? (JSON.parse(liveStreamsStr) as LiveStream[])
                : []
                return {liveCategories, liveStreams}
            },
            {
                fulfilled: (state, action: PayloadAction<{liveCategories: Category[], liveStreams: LiveStream[]}>) => {
                    state.liveCategories = action.payload.liveCategories
                    state.liveStreams = action.payload.liveStreams
                }
            }
        ),
        fetchLiveCategoriesAsync: create.asyncThunk(
            async (_, thunkAPI) => {
                  const state = thunkAPI.getState() as RootState
                
                  const config = state.app.apiConfig
                
                  if (
                    ![config.auth.username, config.auth.password, config.baseUrl].every(Boolean)
                  ) {
                    return Promise.reject("no api config")
                  }
                
                  const categories = await XtremeCodesAPI.getLiveStreamCategories(config)

                  return categories
            },
            {
                fulfilled: (state, action: PayloadAction<Category[]>) => {
                    state.liveCategories = action.payload
                    
                    localStorageSet(
                        STORAGE_KEY.LIVE_CATEGORIES,
                        JSON.stringify(state.liveCategories),
                    ).catch(console.error)
                }
            },
        ),
        fetchLiveStreamsAsync: create.asyncThunk(
            async (_, thunkAPI) => {
                const state = thunkAPI.getState() as RootState
                
                const config = state.app.apiConfig
            
                if (
                ![config.auth.username, config.auth.password, config.baseUrl].every(Boolean)
                ) {
                return Promise.reject("no api config")
                }
            
                const streams = await XtremeCodesAPI.getLiveStreams(config)

                return streams
            },
            {
                fulfilled: (state, action: PayloadAction<LiveStream[]>) => {
                    state.liveStreams = action.payload
                    
                    localStorageSet(
                        STORAGE_KEY.LIVE_STREAMS,
                        JSON.stringify(state.liveStreams),
                    ).catch(console.error)
                }
            },
        ),
        addToFavorites: create.reducer((state, action: PayloadAction<LiveStream>) => {
            state.favorites.push(action.payload)
            localStorageSet(
                STORAGE_KEY.FAVORITES,
                JSON.stringify(state.favorites),
            ).catch(console.error)
        }),
        removeFromFavorites: create.reducer((state, action: PayloadAction<LiveStream>) => {
            const index = state.favorites.findIndex(
                (element) => element.stream_id === action.payload.stream_id,
            )
            state.favorites.splice(index, 1)
            localStorageSet(
                STORAGE_KEY.FAVORITES,
                JSON.stringify(state.favorites),
            ).catch(console.error)
        }),
        loadFavoritesAsync: create.asyncThunk( 
            async () => {
               const favoritesStr = await localStorageGet(STORAGE_KEY.FAVORITES)
               const favorites = favoritesStr
                  ? (JSON.parse(favoritesStr) as LiveStream[])
                  : []
               
                return favorites
            },
            {
                fulfilled: (state, action: PayloadAction<LiveStream[]>) => {
                    state.favorites = action.payload
                }
            }
        ),
        fetchShortEpgAsync: create.asyncThunk(
            async (arg: {channelId: number; limit: number}, thunkAPI) => {                const state = thunkAPI.getState() as RootState
                
                const config = state.app.apiConfig
            
                if (
                    ![config.auth.username, config.auth.password, config.baseUrl].every(Boolean)
                ) {
                    return Promise.reject("no api config")
                }
            
                const epg = await XtremeCodesAPI.getEPGForLiveStream(config, arg.channelId, arg.limit)

                return epg
            },
        ),
        connectM3UPlaylist: create.asyncThunk(
            async (arg: { text: string; baseUrl?: string }) => {
                const entries = parseM3U(arg.text, arg.baseUrl)
                return m3uToLiveChannels(entries)
            },
            {
                fulfilled: (state, action: PayloadAction<{ categories: Category[]; streams: LiveStream[] }>) => {
                    state.liveCategories = action.payload.categories
                    state.liveStreams = action.payload.streams

                    localStorageSet(
                        STORAGE_KEY.M3U_CATEGORIES,
                        JSON.stringify(state.liveCategories),
                    ).catch(console.error)
                    localStorageSet(
                        STORAGE_KEY.M3U_CHANNELS,
                        JSON.stringify(state.liveStreams),
                    ).catch(console.error)
                }
            },
        ),
        fetchExternalEpgAsync: create.asyncThunk(
            async (arg: { url: string }) => {
                const listings = await fetchExternalEpg(arg.url)
                const channels: Record<string, LiveStreamEPGItem[]> = {}
                for (const [channel, items] of listings) {
                    channels[channel] = items.map((item) => ({
                        ...item,
                        sourceId: extEpgSourceId(arg.url),
                    }))
                }
                return { url: arg.url, channels }
            },
            {
                pending: (state) => {
                    state.externalEpgStatus = "loading"
                    state.externalEpgError = undefined
                },
                fulfilled: (state, action: PayloadAction<{ url: string; channels: Record<string, LiveStreamEPGItem[]> }>) => {
                    state.externalEpg[action.payload.url] = action.payload.channels
                    state.externalEpgStatus = "ready"
                },
                rejected: (state, action) => {
                    state.externalEpgStatus = "error"
                    state.externalEpgError = action.error.message
                },
            },
        ),
        removeExternalEpgUrl: create.reducer((state, action: PayloadAction<string>) => {
            delete state.externalEpg[action.payload]
            if (Object.keys(state.externalEpg).length === 0) {
                state.externalEpgStatus = "idle"
                state.externalEpgError = undefined
            }
        }),
        fetchBulkEpgAsync: create.asyncThunk(
            async (_, thunkAPI) => {
                const state = thunkAPI.getState() as RootState

                const config = state.app.apiConfig

                if (
                    ![config.auth.username, config.auth.password, config.baseUrl].every(Boolean)
                ) {
                    return Promise.reject("no api config")
                }

                const xmltv = await XtremeCodesAPI.getAllEPG(config)
                const channels: Record<string, LiveStreamEPGItem[]> = {}
                for (const [channel, items] of xmltvToListings(xmltv)) {
                    channels[channel] = items.map((item) => ({
                        ...item,
                        sourceId: XTREAM_BULK_SOURCE_ID,
                    }))
                }
                return channels
            },
            {
                pending: (state) => {
                    state.bulkEpgStatus = "loading"
                    state.bulkEpgError = undefined
                },
                fulfilled: (state, action: PayloadAction<Record<string, LiveStreamEPGItem[]>>) => {
                    state.bulkEpg = action.payload
                    state.bulkEpgStatus = "ready"
                },
                rejected: (state, action) => {
                    state.bulkEpgStatus = "error"
                    state.bulkEpgError = action.error.message
                },
            },
        ),
    }),
    selectors: {
        selectLiveCategories: (state: LiveTvState) => state.liveCategories,
        selectLiveStreams: (state: LiveTvState) => state.liveStreams,
        selectFavorites: (state: LiveTvState) => state.favorites,
        selectExternalEpg: (state: LiveTvState) => state.externalEpg,
        selectExternalEpgStatus: (state: LiveTvState) => state.externalEpgStatus,
        selectExternalEpgError: (state: LiveTvState) => state.externalEpgError,
        selectBulkEpg: (state: LiveTvState) => state.bulkEpg,
        selectBulkEpgStatus: (state: LiveTvState) => state.bulkEpgStatus,
        selectBulkEpgError: (state: LiveTvState) => state.bulkEpgError,
    }
   
})

export const {setLiveCategories, setLiveStreams, loadLiveFromLocalStorageAsync, fetchLiveCategoriesAsync, fetchLiveStreamsAsync, fetchShortEpgAsync, connectM3UPlaylist, fetchExternalEpgAsync, removeExternalEpgUrl, fetchBulkEpgAsync, addToFavorites, removeFromFavorites, loadFavoritesAsync} = liveSlice.actions
export const {selectLiveCategories, selectLiveStreams, selectFavorites, selectExternalEpg, selectExternalEpgStatus, selectExternalEpgError, selectBulkEpg, selectBulkEpgStatus, selectBulkEpgError} = liveSlice.selectors