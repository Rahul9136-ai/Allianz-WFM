import { useQuery } from "@tanstack/react-query";
import { Box, Card, CardContent, Grid, Skeleton, Typography } from "@mui/material";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { DashboardApi } from "../api/endpoints";
import { BRAND } from "../theme/theme";
import { useAuth } from "../context/AuthContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);
ChartJS.defaults.animation = false;

const KPI_DEFS: Array<{ key: string; label: string; suffix?: string; color: string }> = [
  { key: "total", label: "Total Requests", color: BRAND.primary },
  { key: "pending", label: "Pending", color: "#8A5B00" },
  { key: "assigned", label: "Assigned", color: "#0B5FA5" },
  { key: "inProgress", label: "In Progress", color: "#7A3EC7" },
  { key: "completed", label: "Completed", color: "#2E7D32" },
  { key: "cancelled", label: "Cancelled", color: "#5B5B5B" },
  { key: "rejected", label: "Rejected", color: "#C7272F" },
  { key: "today", label: "Today's Requests", color: BRAND.secondary },
  { key: "thisWeek", label: "This Week", color: BRAND.secondary },
  { key: "thisMonth", label: "This Month", color: BRAND.secondary },
  { key: "overdue", label: "Overdue", color: "#C7272F" },
  { key: "avgResolutionHours", label: "Avg Resolution (hrs)", color: "#0B5FA5" },
  { key: "avgFirstResponseHours", label: "Avg First Response (hrs)", color: "#0B5FA5" },
  { key: "slaCompliancePct", label: "SLA Compliance", suffix: "%", color: "#2E7D32" },
  { key: "closedThisWeek", label: "Closed This Week", color: "#2E7D32" },
  { key: "avgTicketAgeHours", label: "Avg Ticket Age (hrs)", color: BRAND.secondary },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => DashboardApi.get(), refetchInterval: 60_000 });

  const kpis = data?.data.data.kpis;
  const charts = data?.data.data.charts;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {user?.role === "OPERATIONS" ? "Your request activity at a glance" : "Executive overview of all WFM requests"}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {KPI_DEFS.map((kpi) => (
          <Grid item xs={6} sm={4} md={3} lg={1.5} key={kpi.key}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                {isLoading ? (
                  <Skeleton variant="text" width="60%" height={36} />
                ) : (
                  <Typography variant="h5" fontWeight={800} sx={{ color: kpi.color }}>
                    {kpis ? (kpis as never)[kpi.key] : 0}
                    {kpi.suffix ?? ""}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {kpi.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Requests by Category
              </Typography>
              {isLoading || !charts ? (
                <Skeleton variant="rectangular" height={260} />
              ) : (
                <Bar
                  data={{
                    labels: charts.byCategory.map((c) => c.name),
                    datasets: [{ label: "Requests", data: charts.byCategory.map((c) => c.count), backgroundColor: BRAND.primary, borderRadius: 6 }],
                  }}
                  options={{ responsive: true, plugins: { legend: { display: false } } }}
                  height={260}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Requests by Vendor
              </Typography>
              {isLoading || !charts ? (
                <Skeleton variant="rectangular" height={260} />
              ) : (
                <Doughnut
                  data={{
                    labels: charts.byVendor.map((v) => v.name),
                    datasets: [{ data: charts.byVendor.map((v) => v.count), backgroundColor: [BRAND.primary, BRAND.secondary, "#0B5FA5", "#ED6C02"] }],
                  }}
                  options={{ responsive: true }}
                  height={260}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Status Distribution
              </Typography>
              {isLoading || !charts ? (
                <Skeleton variant="rectangular" height={260} />
              ) : (
                <Doughnut
                  data={{
                    labels: charts.byStatus.map((s) => s.status.replace(/_/g, " ")),
                    datasets: [
                      {
                        data: charts.byStatus.map((s) => s.count),
                        backgroundColor: ["#8A5B00", "#0B5FA5", "#7A3EC7", "#5B5B5B", "#2E7D32", "#C7272F", "#EDEDED"],
                      },
                    ],
                  }}
                  height={260}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                WFM Performance (Open Tickets by Assignee)
              </Typography>
              {isLoading || !charts ? (
                <Skeleton variant="rectangular" height={260} />
              ) : (
                <Bar
                  data={{
                    labels: charts.byAssignee.map((a) => a.name),
                    datasets: [{ label: "Tickets", data: charts.byAssignee.map((a) => a.count), backgroundColor: "#0B5FA5", borderRadius: 6 }],
                  }}
                  options={{ indexAxis: "y" as const, responsive: true, plugins: { legend: { display: false } } }}
                  height={260}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
