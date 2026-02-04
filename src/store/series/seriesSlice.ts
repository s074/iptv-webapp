import { PayloadAction } from "@reduxjs/toolkit";
import { Category, SeriesStream } from "../../services/XtremeCodesAPI.types";
import { createAppSlice } from "../app/createAppSlice";
import { XtremeCodesAPI } from "../../services/XtremeCodesAPI";
import { RootState } from "../store";
import { localStorageGet, localStorageSet } from "../../services/utils";
import { STORAGE_KEY } from "../../services/constants";

export interface SeriesState {
    seriesCategories: Category[]
    seriesStreams: SeriesStream[]
}

const initialState: SeriesState = {
    seriesCategories: [],
    seriesStreams: [],
}

export const seriesSlice = createAppSlice({
    name: "series",
    initialState,
    reducers: create => ({
        setSeriesCategories: create.reducer((state, action: PayloadAction<Category[]>) => {
            state.seriesCategories = action.payload
        }),
        setSeriesStreams: create.reducer((state, action: PayloadAction<SeriesStream[]>) => {
            state.seriesStreams = action.payload
        }),
        loadSeriesFromLocalStorageAsync: create.asyncThunk(
            async() => {
                const seriesCategoriesStr = await localStorageGet(
                      STORAGE_KEY.SERIES_CATEGORIES,
                    )
                    const seriesCategories = seriesCategoriesStr
                      ? (JSON.parse(seriesCategoriesStr) as Category[])
                      : []

                const seriesStreamsStr = await localStorageGet(STORAGE_KEY.SERIES_STREAMS)
                const seriesStreams = seriesStreamsStr
                  ? (JSON.parse(seriesStreamsStr) as SeriesStream[])
                  : []

                return {seriesCategories, seriesStreams}
            },
            {
                fulfilled: (state, action: PayloadAction<{seriesCategories: Category[], seriesStreams: SeriesStream[]}>) => {
                    state.seriesCategories = action.payload.seriesCategories
                    state.seriesStreams = action.payload.seriesStreams
                }
            }
        ),
        fetchSeriesCategoriesAsync: create.asyncThunk( 
            async (_, thunkAPI) => {
               const state = thunkAPI.getState() as RootState
               const config = state.app.apiConfig
            
                if (
                ![config.auth.username, config.auth.password, config.baseUrl].every(Boolean)
                ) {
                    return Promise.reject("no api config")
                }
            
                const categories = await XtremeCodesAPI.getSeriesStreamCategories(config)
                
                return categories
            },
            {
                fulfilled: (state, action: PayloadAction<Category[]>) => {
                    state.seriesCategories = action.payload

                    localStorageSet(
                        STORAGE_KEY.SERIES_CATEGORIES,
                        JSON.stringify(state.seriesCategories),
                    ).catch(console.error)
                }
            }
        ),
        fetchSeriesStreamsAsync: create.asyncThunk( 
            async (_, thunkAPI) => {
                const state = thunkAPI.getState() as RootState
                const config = state.app.apiConfig
            
                if (
                ![config.auth.username, config.auth.password, config.baseUrl].every(Boolean)
                ) {
                    return Promise.reject("no api config")
                }
            
                const streams = await XtremeCodesAPI.getSeriesStreams(config)
                
                return streams
            },
            {
                fulfilled: (state, action: PayloadAction<SeriesStream[]>) => {
                    state.seriesStreams = action.payload

                    localStorageSet(
                        STORAGE_KEY.SERIES_STREAMS,
                        JSON.stringify(state.seriesStreams),
                    ).catch(console.error)

                }
            }
        ),
        fetchSeriesInfoAsync: create.asyncThunk(
            async (arg: {seriesId: number}, thunkAPI) => {
                const state = thunkAPI.getState() as RootState
                
                const config = state.app.apiConfig
            
                if (
                    ![config.auth.username, config.auth.password, config.baseUrl].every(Boolean)
                ) {
                    return Promise.reject("no api config")
                }
            
                const info = await XtremeCodesAPI.getSeriesInfo(config, arg.seriesId)

                return info
            },
        ),
    }),
    selectors: {
        selectSeriesCategories: (state: SeriesState) => state.seriesCategories,
        selectSeriesStreams: (state: SeriesState) => state.seriesStreams,
    }
})

export const { setSeriesCategories, setSeriesStreams, fetchSeriesCategoriesAsync, fetchSeriesStreamsAsync, fetchSeriesInfoAsync, loadSeriesFromLocalStorageAsync } = seriesSlice.actions

export const { selectSeriesCategories, selectSeriesStreams } = seriesSlice.selectors