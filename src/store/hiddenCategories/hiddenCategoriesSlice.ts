import { PayloadAction } from "@reduxjs/toolkit"
import { localStorageGet, localStorageSet } from "../../services/utils"
import { STORAGE_KEY } from "../../services/constants"
import { createAppSlice } from "../app/createAppSlice"

export type HiddenCategoryType = "live" | "vod" | "series"

// Category ids are stored normalized as strings: panels mix numeric and
// string ids on the wire, and string comparison keeps every consumer safe.
export interface HiddenCategoriesState {
    live: string[]
    vod: string[]
    series: string[]
}

const initialState: HiddenCategoriesState = {
    live: [],
    vod: [],
    series: [],
}

function sanitizeList(value: unknown): string[] {
    if (!Array.isArray(value)) return []
    return value.filter((id): id is string => typeof id === "string")
}

function persist(state: HiddenCategoriesState) {
    localStorageSet(
        STORAGE_KEY.HIDDEN_CATEGORIES,
        JSON.stringify(state),
    ).catch(console.error)
}

export const hiddenCategoriesSlice = createAppSlice({
    name: "hiddenCategories",
    initialState,
    reducers: create => ({
        toggleHiddenCategory: create.reducer(
            (state, action: PayloadAction<{ type: HiddenCategoryType; id: number | string }>) => {
                const id = String(action.payload.id)
                const list = state[action.payload.type]
                const index = list.indexOf(id)
                if (index === -1) list.push(id)
                else list.splice(index, 1)
                persist(state)
            },
        ),
        unhideAllCategories: create.reducer(
            (state, action: PayloadAction<{ type: HiddenCategoryType }>) => {
                state[action.payload.type] = []
                persist(state)
            },
        ),
        loadHiddenCategoriesAsync: create.asyncThunk(
            async () => {
                const raw = await localStorageGet(STORAGE_KEY.HIDDEN_CATEGORIES)
                if (!raw) return initialState
                try {
                    const parsed = JSON.parse(raw) as Partial<Record<HiddenCategoryType, unknown>>
                    return {
                        live: sanitizeList(parsed.live),
                        vod: sanitizeList(parsed.vod),
                        series: sanitizeList(parsed.series),
                    } as HiddenCategoriesState
                } catch {
                    return initialState
                }
            },
            {
                fulfilled: (state, action: PayloadAction<HiddenCategoriesState>) => {
                    state.live = action.payload.live
                    state.vod = action.payload.vod
                    state.series = action.payload.series
                }
            }
        ),
    }),
    selectors: {
        selectHiddenCategories: (state: HiddenCategoriesState) => state,
        selectHiddenLive: (state: HiddenCategoriesState) => state.live,
        selectHiddenVod: (state: HiddenCategoriesState) => state.vod,
        selectHiddenSeries: (state: HiddenCategoriesState) => state.series,
    }
})

export const { toggleHiddenCategory, unhideAllCategories, loadHiddenCategoriesAsync } = hiddenCategoriesSlice.actions

export const { selectHiddenCategories, selectHiddenLive, selectHiddenVod, selectHiddenSeries } = hiddenCategoriesSlice.selectors
