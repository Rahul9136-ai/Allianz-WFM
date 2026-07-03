import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PrintIcon from "@mui/icons-material/PrintOutlined";
import FilterListIcon from "@mui/icons-material/FilterListOutlined";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { CategoriesApi, RequestListParams, RequestsApi, UsersApi, VendorsApi } from "../api/endpoints";
import { PriorityChip, StatusChip } from "../components/common/Chips";
import { SlaChip } from "../components/common/Chips";
import { useAuth } from "../context/AuthContext";

const STATUS_OPTIONS = ["PENDING", "ASSIGNED", "IN_PROGRESS", "WAITING_FOR_INFORMATION", "COMPLETED", "REJECTED", "CANCELLED"];
const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function RequestsListPage({ mine = false }: { mine?: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<string[]>([]);

  const params: RequestListParams = {
    page: page + 1,
    pageSize,
    search: search || undefined,
    status: status || undefined,
    priority: priority || undefined,
    vendorId: vendorId || undefined,
    categoryId: categoryId || undefined,
    sortBy,
    sortDir,
    mine,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["requests", params],
    queryFn: () => RequestsApi.list(params),
  });
  const { data: vendors } = useQuery({ queryKey: ["vendors"], queryFn: () => VendorsApi.list() });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: () => CategoriesApi.list() });
  const { data: users } = useQuery({ queryKey: ["users"], queryFn: () => UsersApi.list(), enabled: !mine && user?.role !== "OPERATIONS" });

  const items = data?.data.items ?? [];
  const pagination = data?.data.pagination;
  const canManage = user?.role === "WFM" || user?.role === "ADMIN";

  const bulkMutation = useMutation({
    mutationFn: (changes: Record<string, unknown>) => RequestsApi.bulkUpdate(selected, changes),
    onSuccess: () => {
      toast.success(`Updated ${selected.length} ticket(s)`);
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: () => toast.error("Bulk update failed"),
  });

  const wfmUsers = useMemo(() => users?.data.data.filter((u) => u.role === "WFM") ?? [], [users]);

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const toggleSelectAll = () => {
    if (selected.length === items.length) setSelected([]);
    else setSelected(items.map((i) => i.id));
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {mine ? "My Requests" : "All Requests"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {pagination?.total ?? 0} total tickets
          </Typography>
        </Box>
        <Button startIcon={<PrintIcon />} variant="outlined" onClick={() => window.print()}>
          Print
        </Button>
      </Box>

      <Card sx={{ mb: 2 }}>
        <Toolbar sx={{ flexWrap: "wrap", gap: 1.5, py: 1.5 }}>
          <TextField
            size="small"
            placeholder="Search ticket #, agent, description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ minWidth: 260 }}
          />
          <TextField size="small" select label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} sx={{ minWidth: 160 }}>
            <MenuItem value="">All Statuses</MenuItem>
            {STATUS_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                {s.replace(/_/g, " ")}
              </MenuItem>
            ))}
          </TextField>
          <TextField size="small" select label="Priority" value={priority} onChange={(e) => { setPriority(e.target.value); setPage(0); }} sx={{ minWidth: 140 }}>
            <MenuItem value="">All Priorities</MenuItem>
            {PRIORITY_OPTIONS.map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </TextField>
          <TextField size="small" select label="Vendor" value={vendorId} onChange={(e) => { setVendorId(e.target.value); setPage(0); }} sx={{ minWidth: 140 }}>
            <MenuItem value="">All Vendors</MenuItem>
            {vendors?.data.data.map((v) => (
              <MenuItem key={v.id} value={v.id}>
                {v.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField size="small" select label="Category" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(0); }} sx={{ minWidth: 170 }}>
            <MenuItem value="">All Categories</MenuItem>
            {categories?.data.data.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
          <Tooltip title="Filters applied live">
            <FilterListIcon color="disabled" />
          </Tooltip>
        </Toolbar>

        {canManage && selected.length > 0 && (
          <Toolbar sx={{ bgcolor: "#FCE7E8", gap: 1.5 }}>
            <Typography variant="body2" fontWeight={700} sx={{ flexGrow: 1 }}>
              {selected.length} selected
            </Typography>
            <TextField
              size="small"
              select
              label="Set Status"
              sx={{ minWidth: 180 }}
              value=""
              onChange={(e) => bulkMutation.mutate({ status: e.target.value })}
            >
              {STATUS_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              select
              label="Assign To"
              sx={{ minWidth: 180 }}
              value=""
              onChange={(e) => bulkMutation.mutate({ assignedToId: e.target.value })}
            >
              {wfmUsers.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </MenuItem>
              ))}
            </TextField>
          </Toolbar>
        )}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {canManage && (
                  <TableCell padding="checkbox">
                    <Checkbox indeterminate={selected.length > 0 && selected.length < items.length} checked={items.length > 0 && selected.length === items.length} onChange={toggleSelectAll} />
                  </TableCell>
                )}
                <TableCell>
                  <TableSortLabel active={sortBy === "ticketNumber"} direction={sortDir} onClick={() => toggleSort("ticketNumber")}>
                    Ticket #
                  </TableSortLabel>
                </TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Team Leader</TableCell>
                <TableCell>Agent</TableCell>
                <TableCell>Agent ID</TableCell>
                <TableCell>
                  <TableSortLabel active={sortBy === "priority"} direction={sortDir} onClick={() => toggleSort("priority")}>
                    Priority
                  </TableSortLabel>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>
                  <TableSortLabel active={sortBy === "createdAt"} direction={sortDir} onClick={() => toggleSort("createdAt")}>
                    Created
                  </TableSortLabel>
                </TableCell>
                <TableCell>SLA</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">No requests found.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {items.map((r) => (
                <TableRow key={r.id} hover sx={{ cursor: "pointer" }}>
                  {canManage && (
                    <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.includes(r.id)}
                        onChange={() => setSelected((prev) => (prev.includes(r.id) ? prev.filter((id) => id !== r.id) : [...prev, r.id]))}
                      />
                    </TableCell>
                  )}
                  <TableCell onClick={() => navigate(`/requests/${r.id}`)}>
                    <Chip label={r.ticketNumber} size="small" sx={{ fontWeight: 700, bgcolor: "#F5F5F5" }} />
                  </TableCell>
                  <TableCell onClick={() => navigate(`/requests/${r.id}`)}>{r.category.name}</TableCell>
                  <TableCell onClick={() => navigate(`/requests/${r.id}`)}>{r.vendor.name}</TableCell>
                  <TableCell onClick={() => navigate(`/requests/${r.id}`)}>{r.teamLeaderName}</TableCell>
                  <TableCell onClick={() => navigate(`/requests/${r.id}`)}>{r.agentName}</TableCell>
                  <TableCell onClick={() => navigate(`/requests/${r.id}`)}>{r.agentId}</TableCell>
                  <TableCell onClick={() => navigate(`/requests/${r.id}`)}>
                    <PriorityChip priority={r.priority} />
                  </TableCell>
                  <TableCell onClick={() => navigate(`/requests/${r.id}`)}>
                    <StatusChip status={r.status} />
                  </TableCell>
                  <TableCell onClick={() => navigate(`/requests/${r.id}`)}>{r.assignedTo ? `${r.assignedTo.firstName} ${r.assignedTo.lastName}` : "Unassigned"}</TableCell>
                  <TableCell onClick={() => navigate(`/requests/${r.id}`)}>{format(new Date(r.createdAt), "MMM d, yyyy")}</TableCell>
                  <TableCell onClick={() => navigate(`/requests/${r.id}`)}>
                    <SlaChip slaStatus={r.slaStatus} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={pagination?.total ?? 0}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Card>
    </Box>
  );
}
