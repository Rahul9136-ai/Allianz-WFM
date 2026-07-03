import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Box, Button, Card, Chip, List, ListItemButton, ListItemText, Typography } from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import { NotificationsApi } from "../api/endpoints";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["notifications"], queryFn: () => NotificationsApi.list() });

  const markAllRead = useMutation({
    mutationFn: () => NotificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => NotificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifications = data?.data.data ?? [];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          Notifications
        </Typography>
        <Button variant="outlined" onClick={() => markAllRead.mutate()} disabled={notifications.every((n) => n.isRead)}>
          Mark all as read
        </Button>
      </Box>

      <Card>
        <List disablePadding>
          {notifications.length === 0 && (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">No notifications yet.</Typography>
            </Box>
          )}
          {notifications.map((n) => (
            <ListItemButton
              key={n.id}
              divider
              sx={{ bgcolor: n.isRead ? "transparent" : "#FCE7E8" }}
              onClick={() => {
                if (!n.isRead) markRead.mutate(n.id);
                if (n.request) navigate(`/requests/${n.request.id}`);
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" fontWeight={700}>
                      {n.subject}
                    </Typography>
                    <Chip label={n.status} size="small" sx={{ height: 18, fontSize: 10 }} />
                  </Box>
                }
                secondary={formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
              />
            </ListItemButton>
          ))}
        </List>
      </Card>
    </Box>
  );
}
