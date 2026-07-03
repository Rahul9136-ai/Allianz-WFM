import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Typography } from "@mui/material";
import { format } from "date-fns";
import { AuditLogsApi } from "../api/endpoints";

export default function AuditLogsPage() {
  const [page, setPage] = useState(0);
  const pageSize = 25;
  const { data } = useQuery({ queryKey: ["audit-logs", page], queryFn: () => AuditLogsApi.list(page + 1, pageSize) });

  const logs = data?.data.data ?? [];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
        Audit Logs
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Immutable system-wide activity log. Records are never editable.
      </Typography>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Ticket</TableCell>
                <TableCell>Old Value</TableCell>
                <TableCell>New Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>{format(new Date(log.createdAt), "MMM d, yyyy p")}</TableCell>
                  <TableCell>{log.user ? `${log.user.firstName} ${log.user.lastName}` : "System"}</TableCell>
                  <TableCell>{log.action.replace(/_/g, " ")}</TableCell>
                  <TableCell>{log.request?.ticketNumber ?? "—"}</TableCell>
                  <TableCell sx={{ maxWidth: 220, fontFamily: "monospace", fontSize: 11 }}>{log.oldValue ?? "—"}</TableCell>
                  <TableCell sx={{ maxWidth: 220, fontFamily: "monospace", fontSize: 11 }}>{log.newValue ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={-1}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={pageSize}
          rowsPerPageOptions={[pageSize]}
        />
      </Card>
    </Box>
  );
}
