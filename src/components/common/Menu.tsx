import MuiMenu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import {
  FC,
  Fragment,
  cloneElement,
  useCallback,
  useState,
} from "react"

export interface MenuProps {
  control: React.ReactElement
  id: string
  menus: Array<{ label: string } & { [k: string]: any }>
}

const Menu: FC<MenuProps> = (props) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const { control, id, menus } = props
  const isOpen = Boolean(anchorEl)

  const handleButtonClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl((prev) => (prev ? null : event.currentTarget))
    },
    [],
  )

  const close = useCallback(() => {
    setAnchorEl(null)
  }, [])

  return (
    <Fragment>
      {cloneElement(control as React.ReactElement<any>, {
        type: "button",
        onClick: handleButtonClick,
        "aria-controls": isOpen ? id : undefined,
        "aria-expanded": isOpen || undefined,
        "aria-haspopup": "menu",
      })}
      <MuiMenu
        id={id}
        open={isOpen}
        onClose={close}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ minWidth: 120 }}
      >
        {menus.map(({ label, active, ...item }) => (
          <MenuItem
            key={label}
            selected={Boolean(active)}
            onClick={close}
            {...item}
          >
            {label}
          </MenuItem>
        ))}
      </MuiMenu>
    </Fragment>
  )
}

export default Menu
