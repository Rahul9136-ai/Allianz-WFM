import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Box, Button, Card, CardContent, Divider, Grid, TextField, Typography } from "@mui/material";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { AuthApi } from "../api/endpoints";

export default function SettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const changePasswordMutation = useMutation({
    mutationFn: () => AuthApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to update password";
      toast.error(message);
    },
  });

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        Settings
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Profile
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Name
              </Typography>
              <Typography variant="body2">
                {user?.firstName} {user?.lastName}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body2">{user?.email}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Role
              </Typography>
              <Typography variant="body2">{user?.role}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Change Password
          </Typography>
          <TextField
            label="Current Password"
            type="password"
            fullWidth
            sx={{ mb: 2 }}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <TextField label="New Password" type="password" fullWidth sx={{ mb: 2 }} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <Divider sx={{ mb: 2 }} />
          <Button
            variant="contained"
            disabled={!currentPassword || newPassword.length < 8 || changePasswordMutation.isPending}
            onClick={() => changePasswordMutation.mutate()}
          >
            Update Password
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
