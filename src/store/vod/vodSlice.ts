import { PayloadAction } from "@reduxjs/toolkit"
import { Category, VodStream } from "../../services/XtremeCodesAPI.types"
import { createAppSlice } from "../app/createAppSlice";
import { localStorageGet, localStorageSet } from "../../services/utils"
import { STORAGE_KEY } from "../../services/constants"
import { RootState } from "../store"
import { XtremeCodesAPI } from "../../services/XtremeCodesAPI"

export interface VodState {
    vodCategories: Category[]
    vodStreams: VodStream[]
}

const initialState: VodState = {
    vodCategories: [],
    vodStreams: [],
}

export const vodSlice = createAppSlice({
    name: "vod",
    initialState,
    reducers: create => ({
        setVodCategories: create.reducer((state, action: PayloadAction<Category[]>) => {
            state.vodCategories = action.payload
        }),
        setVodStreams: create.reducer((state, action: PayloadAction<VodStream[]>) => {
            state.vodStreams = action.payload
        }),
        loadVodFromLocalStorageAsync: create.asyncThunk(
            async () => {
                const vodCategoriesStr = await localStorageGet(STORAGE_KEY.VOD_CATEGORIES)
                const vodCategories = vodCategoriesStr
                ? (JSON.parse(vodCategoriesStr) as Category[])
                : []
                const vodStreamsStr = await localStorageGet(STORAGE_KEY.VOD_STREAMS)
                const vodStreams = vodStreamsStr
                ? (JSON.parse(vodStreamsStr) as VodStream[])
                : []
                return {vodCategories, vodStreams}
            },
            {
                fulfilled: (state, action: PayloadAction<{vodCategories: Category[], vodStreams: VodStream[]}>) => {
                    state.vodCategories = action.payload.vodCategories
                    state.vodStreams = action.payload.vodStreams
                }
            }
        ),
        fetchVodCategoriesAsync: create.asyncThunk(
            async (_, thunkAPI) => {
                const state = thunkAPI.getState() as RootState

                const config = state.app.apiConfig

                if (
                    ![config.auth.username, config.auth.password, config.baseUrl].every(Boolean)
                ) {
                    return Promise.reject("no api config")
                }

                const categories = await XtremeCodesAPI.getVODStreamCategories(config)
                return categories
            },
            {
                fulfilled: (state, action: PayloadAction<Category[]>) => {
                    state.vodCategories = action.payload

                    localStorageSet(
                        STORAGE_KEY.VOD_CATEGORIES,
                        JSON.stringify(state.vodCategories),
                    ).catch(console.error)
                }
            }
        ),
        fetchVodStreamsAsync: create.asyncThunk(
            async (_, thunkAPI) => {
                const state = thunkAPI.getState() as RootState
                
                const config = state.app.apiConfig
            
                if (
                    ![config.auth.username, config.auth.password, config.baseUrl].every(Boolean)
                ) {
                    return Promise.reject("no api config")
                }
            
                const streams = await XtremeCodesAPI.getVODStreams(config)

                return streams
            },
            {
                fulfilled: (state, action: PayloadAction<VodStream[]>) => {
                    state.vodStreams = action.payload

                    localStorageSet(
                        STORAGE_KEY.VOD_STREAMS,
                        JSON.stringify(state.vodStreams),
                    ).catch(console.error)
                }
            }
        ),
        fetchVodInfoAsync: create.asyncThunk(
            async (arg: {vodId: number}, thunkAPI) => {
                const state = thunkAPI.getState() as RootState
                
                const config = state.app.apiConfig
            
                if (
                    ![config.auth.username, config.auth.password, config.baseUrl].every(Boolean)
                ) {
                    return Promise.reject("no api config")
                }
            
                const info = await XtremeCodesAPI.getVODInfo(config, arg.vodId)

                return info
            },
        ),
    }),
    selectors: {
        selectVodCategories: (state: VodState) => state.vodCategories,
        selectVodStreams: (state: VodState) => state.vodStreams,
    }
})

export const {setVodCategories, setVodStreams, fetchVodCategoriesAsync, fetchVodStreamsAsync, fetchVodInfoAsync, loadVodFromLocalStorageAsync} = vodSlice.actions
export const {selectVodCategories, selectVodStreams} = vodSlice.selectors
