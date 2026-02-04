import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import {
  XtremeCodesConfig,
  AccountInfo,
} from "../../services/XtremeCodesAPI.types"
import {
  fetchAccountInfo,
  loadApp,
} from "./thunks"
import {
  deleteAccountFromLocalStorage,
  localStorageSet,
} from "../../services/utils"
import { STORAGE_KEY } from "../../services/constants"

export interface AppState {
  status: "needsLoad" | "needsAuth" | "ready"
  apiConfig: XtremeCodesConfig
  accountInfo: AccountInfo
  lastFetchedAccountInfo: number
}

const initialState: AppState = {
  status: "needsLoad",
  apiConfig: { baseUrl: "", auth: { username: "", password: "" } },
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadApp.fulfilled, (state, action) => {
        state.apiConfig = action.payload.apiConfig
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
  setAppStatus,
  removeAccount,
} = appSlice.actions

export default appSlice.reducer
