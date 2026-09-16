import Box, { type BoxProps } from "@mui/material/Box"
import Paper from "@mui/material/Paper"

function Root(props: BoxProps) {
  return (
    <Box
      {...props}
      sx={[
        {
          bgcolor: "background.default",
          display: "flex",
          flexDirection: "column",
          height: "100dvh",
          overflow: "hidden",
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    />
  )
}
function Header(props: BoxProps) {
  return (
    <Box
      component="header"
      className="Header"
      {...props}
      sx={[
        {
          px: 2,
          py: 1,
          gap: 2,
          minHeight: 64,
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(18, 22, 29, 0.85)"
              : "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(12px)",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid",
          borderColor: "divider",
          position: "sticky",
          top: 0,
          zIndex: 1100,
          flexShrink: 0,
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    />
  )
}

function SideNav(props: BoxProps) {
  return (
    <Box
      component="nav"
      className="Navigation"
      {...props}
      sx={[
        {
          p: 2,
          bgcolor: "background.paper",
          borderRight: "1px solid",
          borderColor: "divider",
          display: {
            xs: "none",
            sm: "initial",
          },
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    />
  )
}

function Main(props: BoxProps) {
  return (
    <Box
      component="main"
      className="Main"
      {...props}
      sx={[
        {
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          p: 2,
          display: "flex",
          flexDirection: "column",
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    />
  )
}

function SideDrawer({
  onClose,
  ...props
}: BoxProps & { onClose: React.MouseEventHandler<HTMLDivElement> }) {
  return (
    <Box
      {...props}
      sx={[
        { position: "fixed", zIndex: 1200, width: "100%", height: "100%" },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    >
      <Box
        role="button"
        onClick={onClose}
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(0, 0, 0, 0.5)"
              : "rgba(0, 0, 0, 0.25)",
        }}
      />
      <Paper
        elevation={8}
        sx={{
          minWidth: 256,
          width: "max-content",
          height: "100%",
          p: 2,
          bgcolor: "background.paper",
        }}
      >
        {props.children}
      </Paper>
    </Box>
  )
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  Root,
  Header,
  SideNav,
  SideDrawer,
  Main,
}
