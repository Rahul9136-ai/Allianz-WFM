import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import AttachFileIcon from "@mui/icons-material/AttachFileOutlined";
import DownloadIcon from "@mui/icons-material/DownloadOutlined";
import LockIcon from "@mui/icons-material/LockOutlined";
import { format, formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { RequestsApi, UsersApi } from "../api/endpoints";
import { PriorityChip, StatusChip } from "../components/common/Chips";
import SlaCountdown from "../components/common/SlaCountdown";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const STATUS_OPTIONS = ["PENDING", "ASSIGNED", "IN_PROGRESS", "WAITING_FOR_INFORMATION", "COMPLETED", "REJECTED", "CANCELLED"];

export default function RequestDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [commentBody, setCommentBody] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canManage = user?.role === "WFM" || user?.role === "ADMIN";

  const { data: requestRes, isLoading } = useQuery({ queryKey: ["request", id], queryFn: () => RequestsApi.get(id), enabled: !!id });
  const { data: commentsRes } = useQuery({ queryKey: ["request", id, "comments"], queryFn: () => RequestsApi.comments(id), enabled: !!id });
  const { data: attachmentsRes } = useQuery({ queryKey: ["request", id, "attachments"], queryFn: () => RequestsApi.attachments(id), enabled: !!id });
  const { data: historyRes } = useQuery({ queryKey: ["request", id, "history"], queryFn: () => RequestsApi.history(id), enabled: !!id });
  const { data: auditRes } = useQuery({ queryKey: ["request", id, "audit"], queryFn: () => RequestsApi.audit(id), enabled: !!id && canManage });
  const { data: usersRes } = useQuery({ queryKey: ["users"], queryFn: () => UsersApi.list(), enabled: canManage });

  const request = requestRes?.data.data;
  const wfmUsers = usersRes?.data.data.filter((u) => u.role === "WFM") ?? [];

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["request", id] });
    queryClient.invalidateQueries({ queryKey: ["requests"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const wfmUpdateMutation = useMutation({
    mutationFn: (changes: Record<string, unknown>) => RequestsApi.wfmUpdate(id, changes),
    onSuccess: () => {
      toast.success("Ticket updated");
      invalidateAll();
    },
    onError: () => toast.error("Update failed"),
  });

  const commentMutation = useMutation({
    mutationFn: () => RequestsApi.addComment(id, commentBody, isInternalComment),
    onSuccess: () => {
      setCommentBody("");
      setIsInternalComment(false);
      queryClient.invalidateQueries({ queryKey: ["request", id, "comments"] });
      toast.success("Comment posted");
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (files: FileList) => RequestsApi.uploadAttachments(id, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["request", id, "attachments"] });
      toast.success("File(s) uploaded");
    },
  });

  const downloadAttachment = async (attachmentId: string, fileName: string) => {
    const res = await api.get(`/requests/${id}/attachments/${attachmentId}/download`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading || !request) {
    return <Typography color="text.secondary">Loading ticket...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="h5" fontWeight={800}>
              {request.ticketNumber}
            </Typography>
            <StatusChip status={request.status} />
            <PriorityChip priority={request.priority} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {request.category.name} · {request.vendor.name} · Created {format(new Date(request.createdAt), "MMM d, yyyy p")}
          </Typography>
        </Box>
        <SlaCountdown dueAt={request.slaDueAt} slaStatus={request.slaStatus} />
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Request Details
              </Typography>
              <Grid container spacing={2}>
                <Field label="Team Leader" value={`${request.teamLeaderName} (${request.teamLeaderEmail})`} />
                <Field label="Agent" value={`${request.agentName} (${request.agentEmail})`} />
                <Field label="Agent ID" value={request.agentId} />
                <Field label="Effective Date" value={format(new Date(request.effectiveDate), "MMM d, yyyy")} />
                <Field label="Requested By" value={`${request.createdBy.firstName} ${request.createdBy.lastName}`} />
                <Field label="Assigned To" value={request.assignedTo ? `${request.assignedTo.firstName} ${request.assignedTo.lastName}` : "Unassigned"} />
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary" fontWeight={700} sx={{ mb: 0.5 }}>
                Description
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {request.description}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}>
              <Tab label={`Comments (${commentsRes?.data.data.length ?? 0})`} />
              <Tab label={`Attachments (${attachmentsRes?.data.data.length ?? 0})`} />
              <Tab label="Activity Timeline" />
              {canManage && <Tab label="Audit Trail" />}
            </Tabs>

            {tab === 0 && (
              <CardContent>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 420, overflowY: "auto", mb: 2 }}>
                  {commentsRes?.data.data.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No comments yet. Start the conversation below.
                    </Typography>
                  )}
                  {commentsRes?.data.data.map((c) => (
                    <Box key={c.id} sx={{ display: "flex", gap: 1.5 }}>
                      <Avatar sx={{ width: 34, height: 34, fontSize: 13, bgcolor: c.isInternal ? "#5B5B5B" : "#C7272F" }}>
                        {c.author.firstName[0]}
                        {c.author.lastName[0]}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" fontWeight={700}>
                            {c.author.firstName} {c.author.lastName}
                          </Typography>
                          {c.isInternal && <Chip icon={<LockIcon sx={{ fontSize: 14 }} />} label="Internal" size="small" sx={{ height: 20 }} />}
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                          </Typography>
                        </Box>
                        <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5, bgcolor: c.isInternal ? "#FFF9E6" : "background.default" }}>
                          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                            {c.body}
                          </Typography>
                        </Paper>
                      </Box>
                    </Box>
                  ))}
                </Box>
                <Divider sx={{ mb: 2 }} />
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder="Write a comment... use @name to mention someone"
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                />
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                  {canManage ? (
                    <FormControlLabel
                      control={<Checkbox checked={isInternalComment} onChange={(e) => setIsInternalComment(e.target.checked)} />}
                      label="Internal note (WFM only)"
                    />
                  ) : (
                    <span />
                  )}
                  <Button variant="contained" disabled={!commentBody.trim() || commentMutation.isPending} onClick={() => commentMutation.mutate()}>
                    Post Comment
                  </Button>
                </Box>
              </CardContent>
            )}

            {tab === 1 && (
              <CardContent>
                <Button startIcon={<AttachFileIcon />} variant="outlined" onClick={() => fileInputRef.current?.click()} sx={{ mb: 2 }}>
                  Upload Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  onChange={(e) => e.target.files && uploadMutation.mutate(e.target.files)}
                />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {attachmentsRes?.data.data.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No attachments uploaded.
                    </Typography>
                  )}
                  {attachmentsRes?.data.data.map((a) => (
                    <Paper key={a.id} variant="outlined" sx={{ p: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {a.fileName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(a.sizeBytes / 1024).toFixed(0)} KB · {format(new Date(a.createdAt), "MMM d, yyyy p")}
                        </Typography>
                      </Box>
                      <Button size="small" startIcon={<DownloadIcon />} onClick={() => downloadAttachment(a.id, a.fileName)}>
                        Download
                      </Button>
                    </Paper>
                  ))}
                </Box>
              </CardContent>
            )}

            {tab === 2 && (
              <CardContent>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {historyRes?.data.data.map((h) => (
                    <Box key={h.id} sx={{ display: "flex", gap: 1.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main", mt: 0.8 }} />
                      <Box>
                        <Typography variant="body2">
                          <strong>
                            {h.user.firstName} {h.user.lastName}
                          </strong>{" "}
                          {h.note ?? `changed ${h.field} ${h.oldValue ? `from "${h.oldValue}" ` : ""}to "${h.newValue}"`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(h.createdAt), "MMM d, yyyy p")}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            )}

            {tab === 3 && canManage && (
              <CardContent>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {auditRes?.data.data.map((entry) => (
                    <Paper key={entry.id} variant="outlined" sx={{ p: 1.5 }}>
                      <Typography variant="body2" fontWeight={700}>
                        {entry.action.replace(/_/g, " ")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : "System"} · {format(new Date(entry.createdAt), "MMM d, yyyy p")}
                      </Typography>
                      {(entry.oldValue || entry.newValue) && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, fontFamily: "monospace" }}>
                          {entry.oldValue && `old: ${entry.oldValue}`} {entry.newValue && `new: ${entry.newValue}`}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Box>
              </CardContent>
            )}
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          {canManage && (
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                  WFM Panel
                </Typography>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  size="small"
                  value={request.status}
                  onChange={(e) => wfmUpdateMutation.mutate({ status: e.target.value })}
                  sx={{ mb: 2 }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  fullWidth
                  label="Assigned To"
                  size="small"
                  value={request.assignedToId ?? ""}
                  onChange={(e) => wfmUpdateMutation.mutate({ assignedToId: e.target.value || null })}
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {wfmUsers.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  fullWidth
                  label="Priority"
                  size="small"
                  value={request.priority}
                  onChange={(e) => wfmUpdateMutation.mutate({ priority: e.target.value })}
                  sx={{ mb: 2 }}
                >
                  {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </TextField>

                <DatePicker
                  label="Estimated Completion Date"
                  value={request.estimatedCompletionDate ? new Date(request.estimatedCompletionDate) : null}
                  onChange={(v) => wfmUpdateMutation.mutate({ estimatedCompletionDate: v })}
                  slotProps={{ textField: { fullWidth: true, size: "small", sx: { mb: 2 } } }}
                />

                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Internal Notes"
                  size="small"
                  defaultValue={request.internalNotes ?? ""}
                  onBlur={(e) => {
                    if (e.target.value !== (request.internalNotes ?? "")) {
                      wfmUpdateMutation.mutate({ internalNotes: e.target.value });
                    }
                  }}
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Visible to WFM & Admin only
                </Typography>
              </CardContent>
            </Card>
          )}

          <Card sx={{ mt: canManage ? 2 : 0 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                SLA
              </Typography>
              <Field label="SLA Due" value={request.slaDueAt ? format(new Date(request.slaDueAt), "MMM d, yyyy p") : "—"} />
              <Field label="Completion Date" value={request.completionDate ? format(new Date(request.completionDate), "MMM d, yyyy p") : "—"} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Grid item xs={12} sm={6}>
      <Typography variant="caption" color="text.secondary" display="block" fontWeight={700}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Grid>
  );
}
