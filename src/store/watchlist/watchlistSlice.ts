import { PayloadAction } from "@reduxjs/toolkit"
import { WatchlistItem } from "../types"
import { localStorageGet, localStorageSet } from "../../services/utils"
import { STORAGE_KEY } from "../../services/constants"
import { createAppSlice } from "../app/createAppSlice"

export interface WatchlistState {
    watchlist: WatchlistItem[]
}

const initialState: WatchlistState = {
    watchlist: [],
}

export const watchlistSlice = createAppSlice({
    name: "watchlist",
    initialState,
    reducers: create => ({
        addToWatchlist: create.reducer((state, action: PayloadAction<WatchlistItem>) => {
            state.watchlist.push(action.payload)
            localStorageSet(
            STORAGE_KEY.WATCHLIST,
            JSON.stringify(state.watchlist),
            ).catch(console.error)
        }),
        removeFromWatchlist: create.reducer((state, action: PayloadAction<WatchlistItem>) => {
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
        }),
        loadWatchlistAsync: create.asyncThunk( 
            async () => {
               const watchlistStr = await localStorageGet(STORAGE_KEY.WATCHLIST)
                 const watchlist = watchlistStr
                   ? (JSON.parse(watchlistStr) as WatchlistItem[])
                   : []
               
                 return watchlist
            },
            {
                fulfilled: (state, action: PayloadAction<WatchlistItem[]>) => {
                    state.watchlist = action.payload
                }
            }
        ),
    }),
    selectors: {
        selectWatchlist: (state) => state.watchlist,
    }
})

export const { addToWatchlist, removeFromWatchlist, loadWatchlistAsync } = watchlistSlice.actions

export const { selectWatchlist } = watchlistSlice.selectors
