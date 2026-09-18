import { FC, forwardRef, useMemo, useState } from "react"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import IconButton from "@mui/material/IconButton"
import ListItem from "@mui/material/ListItem"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemText from "@mui/material/ListItemText"
import TextField from "@mui/material/TextField"
import InputAdornment from "@mui/material/InputAdornment"
import Typography from "@mui/material/Typography"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import SearchRoundedIcon from "@mui/icons-material/SearchRounded"
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded"
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded"
import { Virtuoso } from "react-virtuoso"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { selectLiveCategories } from "../store/live/liveSlice"
import { selectVodCategories } from "../store/vod/vodSlice"
import { selectSeriesCategories } from "../store/series/seriesSlice"
import {
  HiddenCategoryType,
  toggleHiddenCategory,
  unhideAllCategories,
} from "../store/hiddenCategories/hiddenCategoriesSlice"
import { selectHiddenCategories } from "../store/hiddenCategories/hiddenCategoriesSlice"
import { glassDialogSlotProps } from "./glassDialog"
import { thinScrollbarSx } from "./scrollbar"

const ListScroller = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => (
  <Box
    ref={ref}
    {...props}
    sx={{ overflowY: "auto", overflowX: "hidden", ...thinScrollbarSx }}
  />
))
ListScroller.displayName = "HideCategoriesScroller"

interface HideCategoriesModalProps {
  open: boolean
  onClose: () => void
  type: HiddenCategoryType
  title: string
}

export const HideCategoriesModal: FC<HideCategoriesModalProps> = (props) => {
  const { open, onClose, type, title } = props
  const dispatch = useAppDispatch()
  const [query, setQuery] = useState("")
  const liveCategories = useAppSelector(selectLiveCategories)
  const vodCategories = useAppSelector(selectVodCategories)
  const seriesCategories = useAppSelector(selectSeriesCategories)
  const hidden = useAppSelector(selectHiddenCategories)

  const categories =
    type === "live"
      ? liveCategories
      : type === "vod"
        ? vodCategories
        : seriesCategories
  const hiddenIds = hidden[type]
  const hiddenCount = categories.filter((c) =>
    hiddenIds.includes(String(c.category_id)),
  ).length

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase()
    if (!q) return categories
    return categories.filter((c) =>
      c.category_name?.toLocaleLowerCase().includes(q),
    )
  }, [categories, query])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      scroll="paper"
      slotProps={glassDialogSlotProps}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pr: 1 }}>
        <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 600 }}>
          {title}
        </Typography>
        <IconButton size="small" onClick={onClose} aria-label="close">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, display: "flex", flexDirection: "column" }}>
        <Box sx={{ p: 1.5, pb: 1 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search categories…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
        <Box sx={{ height: 420, minHeight: 0 }}>
          {filtered.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No categories match “{query}”.
              </Typography>
            </Box>
          ) : (
            <Virtuoso
              data={filtered}
              computeItemKey={(_, c) => c.category_id ?? c.category_name ?? Math.random()}
              components={{ Scroller: ListScroller }}
              itemContent={(_, category) => {
                const isHidden = hiddenIds.includes(String(category.category_id))
                return (
                  <ListItem disablePadding sx={{ px: 1 }}>
                    <ListItemButton
                      onClick={() =>
                        dispatch(
                          toggleHiddenCategory({
                            type,
                            id: String(category.category_id),
                          }),
                        )
                      }
                      sx={{ borderRadius: 2 }}
                    >
                      {isHidden ? (
                        <VisibilityOffRoundedIcon
                          fontSize="small"
                          color="disabled"
                          sx={{ mr: 1 }}
                        />
                      ) : (
                        <VisibilityRoundedIcon
                          fontSize="small"
                          color="primary"
                          sx={{ mr: 1 }}
                        />
                      )}
                      <ListItemText
                        primary={category.category_name}
                        slotProps={{
                          primary: {
                            noWrap: true,
                            variant: "body2",
                            sx: {
                              fontWeight: isHidden ? 400 : 600,
                              color: isHidden
                                ? "text.disabled"
                                : "text.primary",
                            },
                          },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                )
              }}
            />
          )}
        </Box>
        <Box
          sx={{
            px: 2,
            py: 1,
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            {hiddenCount} of {categories.length} hidden
          </Typography>
          {hiddenCount > 0 && (
            <Button size="small" onClick={() => dispatch(unhideAllCategories({ type }))}>
              Show all
            </Button>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  )
}
