import { createTheme } from "@mui/material/styles";

export const BRAND = {
  primary: "#C7272F",
  primaryDark: "#A31F26",
  secondary: "#5B5B5B",
  background: "#FFFFFF",
  lightGrey: "#F5F5F5",
  borderGrey: "#DDDDDD",
  success: "#2E7D32",
  warning: "#ED6C02",
  error: "#C7272F",
};

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: BRAND.primary, dark: BRAND.primaryDark, contrastText: "#fff" },
    secondary: { main: BRAND.secondary, contrastText: "#fff" },
    success: { main: BRAND.success },
    warning: { main: BRAND.warning },
    error: { main: BRAND.error },
    background: { default: BRAND.lightGrey, paper: BRAND.background },
    text: { primary: "#262626", secondary: BRAND.secondary },
    divider: BRAND.borderGrey,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, Arial, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          border: `1px solid ${BRAND.borderGrey}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, paddingTop: 8, paddingBottom: 8 },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 8, fontWeight: 600 } },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: BRAND.primary, boxShadow: "none" },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { backgroundColor: BRAND.lightGrey, fontWeight: 700, color: "#262626" },
      },
    },
  },
});
