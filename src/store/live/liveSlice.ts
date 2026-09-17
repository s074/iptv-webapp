import { PayloadAction } from "@reduxjs/toolkit";
import { createAppSlice } from "../app/createAppSlice";
import { Category, LiveStream } from "../../services/XtremeCodesAPI.types";
import { localStorageGet, localStorageSet } from "../../services/utils";
import { STORAGE_KEY } from "../../services/constants";
import { XtremeCodesAPI } from "../../services/XtremeCodesAPI";
import { m3uToLiveChannels, parseM3U } from "../../services/m3u";
import { RootState } from "../store";

export interface LiveTvState {
    liveCategories: Category[]
    liveStreams: LiveStream[]
    favorites: LiveStream[]
}

const initialState: LiveTvState = {
    liveCategories: [],
    liveStreams: [],
    favorites: [],
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
    }),
    selectors: {
        selectLiveCategories: (state: LiveTvState) => state.liveCategories,
        selectLiveStreams: (state: LiveTvState) => state.liveStreams,
        selectFavorites: (state: LiveTvState) => state.favorites,
    }
   
})

export const {setLiveCategories, setLiveStreams, loadLiveFromLocalStorageAsync, fetchLiveCategoriesAsync, fetchLiveStreamsAsync, fetchShortEpgAsync, connectM3UPlaylist, addToFavorites, removeFromFavorites, loadFavoritesAsync} = liveSlice.actions
export const {selectLiveCategories, selectLiveStreams, selectFavorites} = liveSlice.selectors