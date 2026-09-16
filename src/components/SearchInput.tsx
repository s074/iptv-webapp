import IconButton from "@mui/material/IconButton"
import InputAdornment from "@mui/material/InputAdornment"
import TextField from "@mui/material/TextField"
import SearchRoundedIcon from "@mui/icons-material/SearchRounded"
import { FC, useState } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { urls } from "../services/urls"
import queryString from "query-string"

export const SearchInput: FC = () => {
  const [query, setQuery] = useState("")
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      event.stopPropagation()
      onSearch()
    }
  }

  const onSearch = () => {
    console.log("searching " + query)
    if (location.pathname !== urls.search) {
      navigate({
        pathname: urls.search,
        search: queryString.stringify({ query }),
      })

      return
    }

    setSearchParams((prev) => {
      prev.set("query", query)
      return prev
    })
  }

  return (
    <TextField
      size="small"
      variant="outlined"
      placeholder="Search anything…"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={onKeyDown}
      sx={{
        flexBasis: "500px",
        display: {
          sm: "flex",
        },
      }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon color="primary" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={onSearch}
                aria-label="Search"
              >
                <SearchRoundedIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  )
}
