import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import {
  XtremeCodesConfig,
  AccountInfo,
} from "../../services/XtremeCodesAPI.types"
import { MediaSource } from "../types"
import {
  fetchAccountInfo,
  loadApp,
  removeAccount,
} from "./thunks"
import {
  localStorageSet,
} from "../../services/utils"
import { STORAGE_KEY } from "../../services/constants"

export interface AppState {
  status: "needsLoad" | "needsAuth" | "ready"
  apiConfig: XtremeCodesConfig
  mediaSource: MediaSource | null
  accountInfo: AccountInfo
  lastFetchedAccountInfo: number
}

const initialState: AppState = {
  status: "needsLoad",
  apiConfig: { baseUrl: "", auth: { username: "", password: "" } },
  mediaSource: null,
  accountInfo: {},
  lastFetchedAccountInfo: 0,
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
    setMediaSource: (state, action: PayloadAction<MediaSource>) => {
      state.mediaSource = action.payload
      localStorageSet(
        STORAGE_KEY.MEDIA_SOURCE,
        JSON.stringify(state.mediaSource),
      ).catch(console.error)
    },
    setAppStatus: (
      state,
      action: PayloadAction<"needsLoad" | "needsAuth" | "ready">,
    ) => {
      state.status = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(removeAccount.fulfilled, (state) => {
        // Status flips only after the store is empty — no stale reads.
        state.status = "needsAuth"
      })
      .addCase(removeAccount.rejected, (state) => {
        state.status = "needsAuth"
        console.error("Failed to clear local storage")
      })
      .addCase(loadApp.fulfilled, (state, action) => {
        state.apiConfig = action.payload.apiConfig
        state.mediaSource = action.payload.mediaSource
        state.status = "ready"
      })
      .addCase(loadApp.rejected, (state, action) => {
        state.status = "needsAuth"
        console.log(action.error)
      })
      .addCase(fetchAccountInfo.fulfilled, (state, action) => {
        state.accountInfo = action.payload
        state.lastFetchedAccountInfo = Date.now()
      })
  },
})

export const {
  setApiConfig,
  setMediaSource,
  setAppStatus,
} = appSlice.actions

export default appSlice.reducer
