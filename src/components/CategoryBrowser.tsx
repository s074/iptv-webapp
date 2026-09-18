import { forwardRef, memo, useMemo, useState, type Key, type ReactNode } from "react"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemText from "@mui/material/ListItemText"
import Badge from "@mui/material/Badge"
import TextField from "@mui/material/TextField"
import InputAdornment from "@mui/material/InputAdornment"
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"
import IconButton from "@mui/material/IconButton"
import Typography from "@mui/material/Typography"
import SearchRoundedIcon from "@mui/icons-material/SearchRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import FolderRoundedIcon from "@mui/icons-material/FolderRounded"
import CheckRoundedIcon from "@mui/icons-material/CheckRounded"
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"
import useMediaQuery from "@mui/material/useMediaQuery"
import { useTheme } from "@mui/material/styles"
import { Virtuoso } from "react-virtuoso"
import { MediaGrid } from "./MediaGrid"
import { thinScrollbarSx } from "./scrollbar"
import { glassDialogSlotProps } from "./glassDialog"

const PickerScroller = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => (
  <Box
    ref={ref}
    {...props}
    sx={{
      overflowY: "auto",
      overflowX: "hidden",
      ...thinScrollbarSx,
    }}
  />
))
PickerScroller.displayName = "PickerScroller"

export interface BrowserCategory {
  id: string
  name: string
}

interface CategoryBrowserProps<T> {
  categories: BrowserCategory[]
  items: T[]
  getCategoryId: (item: T) => string | undefined
  getItemKey: (item: T, index: number) => Key
  renderCard: (item: T, index: number) => ReactNode
  selectedCategoryId: string | undefined
  onSelectCategory: (id: string) => void
  searchPlaceholder?: string
  emptyHint?: string
}

function CategoryBrowserInner<T>(props: CategoryBrowserProps<T>) {
  const {
    categories,
    items,
    getCategoryId,
    getItemKey,
    renderCard,
    selectedCategoryId,
    onSelectCategory,
    searchPlaceholder = "Filter in this category…",
    emptyHint = "Try a different category or search.",
  } = props
  const [pickerOpen, setPickerOpen] = useState(false)
  const [categoryQuery, setCategoryQuery] = useState("")
  const [filter, setFilter] = useState("")
  const [selectedId, setSelectedId] = useState<string | undefined>(
    selectedCategoryId ?? categories[0]?.id,
  )
  // The category list can shrink under us (e.g. hiding the active
  // category in Settings) — fall back to the first visible one instead
  // of rendering an empty grid for a stale id.
  const activeId = categories.some(
    (c) => c.id === (selectedCategoryId ?? selectedId),
  )
    ? (selectedCategoryId ?? selectedId)
    : categories[0]?.id
  const theme = useTheme()
  const fullScreenPicker = useMediaQuery(theme.breakpoints.down("sm"))

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of items) {
      const cid = getCategoryId(item)
      if (cid !== undefined) map.set(cid, (map.get(cid) ?? 0) + 1)
    }
    return map
  }, [items, getCategoryId])

  const activeCategory = categories.find((c) => c.id === activeId)

  const filteredCategories = useMemo(() => {
    const q = categoryQuery.trim().toLocaleLowerCase()
    if (!q) return categories
    return categories.filter((c) =>
      c.name.toLocaleLowerCase().includes(q),
    )
  }, [categories, categoryQuery])

  const visibleItems = useMemo(() => {
    const inCategory = items.filter(
      (item) => getCategoryId(item) === activeId,
    )
    const q = filter.trim().toLocaleLowerCase()
    if (!q) return inCategory
    return inCategory.filter((item) =>
      (item as { name?: string }).name?.toLocaleLowerCase().includes(q),
    )
  }, [items, activeId, filter, getCategoryId])

  const openPicker = () => {
    setCategoryQuery("")
    setPickerOpen(true)
  }

  const pick = (id: string) => {
    setSelectedId(id)
    onSelectCategory(id)
    setPickerOpen(false)
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      {/* Toolbar: Plex-style category button + title filter */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2.5,
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.02), transparent)",
          flexWrap: "wrap",
          flexShrink: 0,
        }}
      >
        <Button
          variant="outlined"
          startIcon={<FolderRoundedIcon />}
          endIcon={<KeyboardArrowDownRoundedIcon />}
          onClick={openPicker}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            maxWidth: { xs: "100%", sm: 320 },
          }}
        >
          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
            {activeCategory?.name ?? "Categories"}
          </Typography>
        </Button>
        <Typography variant="caption" color="text.secondary">
          {visibleItems.length} titles
        </Typography>
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ ml: "auto", width: { xs: "100%", sm: 260 } }}
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

      {/* Grid */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <MediaGrid
          items={visibleItems}
          itemKey={getItemKey}
          renderCard={renderCard}
          emptyHint={emptyHint}
          emptyTitle={filter ? "No matches" : "Nothing here"}
        />
      </Box>

      {/* Category picker modal , handles very long lists */}
      <Dialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        fullScreen={fullScreenPicker}
        maxWidth="xs"
        fullWidth
        scroll="paper"
        slotProps={glassDialogSlotProps}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            pr: 1,
          }}
        >
          <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 600 }}>
            Browse categories
          </Typography>
          <IconButton
            size="small"
            onClick={() => setPickerOpen(false)}
            aria-label="close categories"
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 1.5, pb: 1 }}>
            <TextField
              size="small"
              fullWidth
              autoFocus
              placeholder="Search categories…"
              value={categoryQuery}
              onChange={(e) => setCategoryQuery(e.target.value)}
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
          <Box sx={{ height: fullScreenPicker ? "100%" : 420, minHeight: 0 }}>
            {filteredCategories.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  No categories match “{categoryQuery}”.
                </Typography>
              </Box>
            ) : (
              <Virtuoso
                data={filteredCategories}
                computeItemKey={(_, c) => c.id}
                components={{ Scroller: PickerScroller }}
                itemContent={(_, cat) => {
                  const selected = cat.id === activeId
                  return (
                    <ListItem disablePadding sx={{ px: 1 }}>
                      <ListItemButton
                        selected={selected}
                        onClick={() => pick(cat.id)}
                        sx={{
                          borderRadius: 2,
                          border: "1px solid transparent",
                          "&.Mui-selected": {
                            bgcolor: "rgba(0, 212, 255, 0.12)",
                            borderColor: "rgba(0,212,255,0.35)",
                          },
                        }}
                      >
                        {selected && (
                          <CheckRoundedIcon
                            fontSize="small"
                            color="primary"
                            sx={{ mr: 1 }}
                          />
                        )}
                        <ListItemText
                          primary={cat.name}
                          slotProps={{
                            primary: {
                              noWrap: true,
                              variant: "body2",
                              sx: { fontWeight: selected ? 600 : 400 },
                            },
                          }}
                        />
                        <Badge
                          badgeContent={counts.get(cat.id) ?? 0}
                          color={selected ? "primary" : "default"}
                          sx={{ ml: 1, "& .MuiBadge-badge": { fontSize: 10 } }}
                        />
                      </ListItemButton>
                    </ListItem>
                  )
                }}
              />
            )}
          </Box>
          <Box sx={{ px: 2, py: 1, borderTop: "1px solid", borderColor: "divider" }}>
            <Typography variant="caption" color="text.secondary">
              {filteredCategories.length} of {categories.length} categories
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export const CategoryBrowser = memo(CategoryBrowserInner) as typeof CategoryBrowserInner
