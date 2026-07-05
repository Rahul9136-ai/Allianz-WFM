import { useState } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Drawer,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/DashboardOutlined";
import AddCircleIcon from "@mui/icons-material/AddCircleOutline";
import ListAltIcon from "@mui/icons-material/ListAltOutlined";
import AssignmentIcon from "@mui/icons-material/AssignmentOutlined";
import NotificationsIcon from "@mui/icons-material/NotificationsOutlined";
import HistoryIcon from "@mui/icons-material/HistoryOutlined";
import PeopleIcon from "@mui/icons-material/PeopleOutlined";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import LogoutIcon from "@mui/icons-material/LogoutOutlined";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { NotificationsApi } from "../../api/endpoints";
import { BRAND } from "../../theme/theme";

const DRAWER_WIDTH = 248;
const DRAWER_WIDTH_COLLAPSED = 72;

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => NotificationsApi.list(),
    refetchInterval: 30_000,
  });
  const unreadCount = notifData?.data.data.filter((n) => !n.isRead).length ?? 0;

  const navItems = [
    { label: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { label: "Create Request", icon: <AddCircleIcon />, path: "/requests/new" },
    { label: "My Requests", icon: <ListAltIcon />, path: "/requests/mine" },
    ...(user?.role !== "OPERATIONS" ? [{ label: "All Requests", icon: <AssignmentIcon />, path: "/requests" }] : []),
    { label: "Notifications", icon: <NotificationsIcon />, path: "/notifications", badge: unreadCount },
    ...(user?.role !== "OPERATIONS" ? [{ label: "Audit Logs", icon: <HistoryIcon />, path: "/audit-logs" }] : []),
    ...(user?.role === "ADMIN" ? [{ label: "Users", icon: <PeopleIcon />, path: "/users" }] : []),
    { label: "Settings", icon: <SettingsIcon />, path: "/settings" },
  ];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 1.5 }}>
          <IconButton color="inherit" onClick={() => setCollapsed((c) => !c)} edge="start">
            <MenuIcon />
          </IconButton>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "8px",
              bgcolor: "#fff",
              color: BRAND.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            A
          </Box>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800, letterSpacing: "-0.3px" }}>
            Allianz
            <Typography component="span" sx={{ fontWeight: 500, opacity: 0.85, ml: 1, fontSize: 13 }}>
              WFM Request Portal
            </Typography>
          </Typography>
          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={() => navigate("/notifications")}>
              <Badge badgeContent={unreadCount} color="warning">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 1 }}>
            <Avatar sx={{ bgcolor: "#fff", color: BRAND.primary, width: 34, height: 34, fontSize: 14, fontWeight: 700 }}>
              {user ? `${user.firstName[0]}${user.lastName[0]}` : "?"}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled sx={{ opacity: "1 !important" }}>
              <Box>
                <Typography variant="body2" fontWeight={700}>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.role}
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                navigate("/settings");
              }}
            >
              Settings
            </MenuItem>
            <MenuItem onClick={logout}>
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH,
          flexShrink: 0,
          whiteSpace: "nowrap",
          transition: "width 0.2s",
          [`& .MuiDrawer-paper`]: {
            width: collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH,
            boxSizing: "border-box",
            bgcolor: BRAND.lightGrey,
            borderRight: `1px solid ${BRAND.borderGrey}`,
            transition: "width 0.2s",
            overflowX: "hidden",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ py: 1 }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            return (
              <Tooltip key={item.path} title={collapsed ? item.label : ""} placement="right">
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={active}
                  sx={{
                    mx: 1,
                    my: 0.4,
                    borderRadius: 2,
                    "&.Mui-selected": {
                      bgcolor: BRAND.primary,
                      color: "#fff",
                      "& .MuiListItemIcon-root": { color: "#fff" },
                      "&:hover": { bgcolor: BRAND.primaryDark },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: BRAND.secondary }}>
                    {item.badge ? (
                      <Badge badgeContent={item.badge} color="warning">
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  {!collapsed && <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }} />}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, minWidth: 0 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
