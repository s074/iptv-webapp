import CircularProgress from "@mui/material/CircularProgress"
import { FC } from "react"

export const Loading: FC = () => {
  return (
    <main
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flex: "flex-grow",
        marginTop: 50,
      }}
    >
      <CircularProgress size={40} />
    </main>
  )
}
