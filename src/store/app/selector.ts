import { createSelector } from "@reduxjs/toolkit"
import { RootState } from "../store"

export const selectAppState = (state: RootState) => state.app

export const selectSeries = (state: RootState) => state.series

export const selectVod = (state: RootState) => state.vod

export const selectLive = (state: RootState) => state.live

export const selectAppStatus = createSelector(
  selectAppState,
  (app) => app.status,
)

export const selectAccountInfo = createSelector(
  selectAppState,
  (app) => app.accountInfo,
)

export const selectPreferredBaseUrl = createSelector(
  selectAccountInfo,
  (accountInfo) =>
    `${
      window.location.protocol === "https:"
        ? "https"
        : accountInfo.server_info?.server_protocol
    }://${accountInfo.server_info?.url}:${
      window.location.protocol === "https:" ||
      accountInfo.server_info?.server_protocol === "https"
        ? accountInfo.server_info?.https_port
        : accountInfo.server_info?.port
    }`,
)
