import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { SlaChip } from "./Chips";
import type { SlaStatus } from "../../types";

function formatRemaining(ms: number): string {
  const abs = Math.abs(ms);
  const hours = Math.floor(abs / (1000 * 60 * 60));
  const minutes = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60));
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  const sign = ms < 0 ? "overdue by " : "";
  if (days > 0) return `${sign}${days}d ${remHours}h`;
  return `${sign}${hours}h ${minutes}m`;
}

export default function SlaCountdown({ dueAt, slaStatus }: { dueAt: string | null | undefined; slaStatus: SlaStatus }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!dueAt) return <SlaChip slaStatus={slaStatus} />;

  const diff = new Date(dueAt).getTime() - now.getTime();
  const isClosed = slaStatus === "MET" || slaStatus === "BREACHED";

  return (
    <Box>
      <SlaChip slaStatus={slaStatus} />
      {!isClosed && (
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
          {formatRemaining(diff)} {diff >= 0 ? "remaining" : ""}
        </Typography>
      )}
    </Box>
  );
}
