import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Button, Paper, TextField, Typography, Alert, InputAdornment, IconButton } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAuth } from "../context/AuthContext";
import { BRAND } from "../theme/theme";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Unable to sign in. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%)`,
        p: 2,
      }}
    >
      <Paper elevation={0} sx={{ width: 420, p: 5, borderRadius: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "14px",
              bgcolor: BRAND.primary,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 26,
              mb: 1.5,
            }}
          >
            A
          </Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.5px" }}>
            Allianz
          </Typography>
          <Typography variant="body2" color="text.secondary">
            WFM Request Portal · Sign in to continue
          </Typography>
        </Box>

        {params.get("expired") && <Alert severity="warning" sx={{ mb: 2 }}>Your session expired. Please sign in again.</Alert>}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email address"
            type="email"
            fullWidth
            required
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            fullWidth
            required
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((s) => !s)} edge="end">
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 3, py: 1.3 }}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <Box sx={{ mt: 3, p: 2, bgcolor: BRAND.lightGrey, borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary" display="block" fontWeight={700}>
            Demo accounts (password: Password123!)
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            admin@wfmportal.com · wfm@wfmportal.com · ops@wfmportal.com
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
