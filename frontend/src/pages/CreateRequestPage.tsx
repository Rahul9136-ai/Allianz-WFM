import { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import UploadFileIcon from "@mui/icons-material/UploadFileOutlined";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFileOutlined";
import CloseIcon from "@mui/icons-material/Close";
import toast from "react-hot-toast";
import { CategoriesApi, RequestsApi, VendorsApi } from "../api/endpoints";

const schema = z.object({
  categoryId: z.string().uuid("Category is required"),
  vendorId: z.string().uuid("Vendor is required"),
  effectiveDate: z.date({ required_error: "Effective date is required" }),
  description: z.string().min(1, "Description is required"),
  teamLeaderName: z.string().min(1, "Team leader name is required"),
  teamLeaderEmail: z.string().email("Valid email required"),
  agentName: z.string().min(1, "Agent name is required"),
  agentEmail: z.string().email("Valid email required"),
  agentId: z.string().min(1, "Agent ID is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
});

type FormValues = z.infer<typeof schema>;

export default function CreateRequestPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: () => CategoriesApi.list() });
  const { data: vendors } = useQuery({ queryKey: ["vendors"], queryFn: () => VendorsApi.list() });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "MEDIUM" },
  });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => RequestsApi.create(values),
  });

  const onFilesSelected = (selected: FileList | null) => {
    if (!selected) return;
    const MAX_BYTES = 20 * 1024 * 1024;
    const accepted: File[] = [];
    for (const file of Array.from(selected)) {
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} exceeds the 20 MB limit`);
        continue;
      }
      accepted.push(file);
    }
    setFiles((prev) => [...prev, ...accepted]);
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await createMutation.mutateAsync(values);
      const requestId = res.data.data.id;

      if (files.length > 0) {
        const dt = new DataTransfer();
        files.forEach((f) => dt.items.add(f));
        await RequestsApi.uploadAttachments(requestId, dt.files);
      }

      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`Ticket ${res.data.data.ticketNumber} created successfully`);
      navigate(`/requests/${requestId}`);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to create request";
      toast.error(message);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
        Create Request
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Submit a new request to the Workforce Management team. A ticket number will be generated automatically.
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Request Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Category" fullWidth required error={!!errors.categoryId} helperText={errors.categoryId?.message}>
                      {categories?.data.data.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="vendorId"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Vendor" fullWidth required error={!!errors.vendorId} helperText={errors.vendorId?.message}>
                      {vendors?.data.data.map((v) => (
                        <MenuItem key={v.id} value={v.id}>
                          {v.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="effectiveDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Effective Date"
                      value={field.value ?? null}
                      onChange={(v) => field.onChange(v)}
                      slotProps={{ textField: { fullWidth: true, required: true, error: !!errors.effectiveDate, helperText: errors.effectiveDate?.message } }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Priority" fullWidth required>
                      {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                        <MenuItem key={p} value={p}>
                          {p.charAt(0) + p.slice(1).toLowerCase()}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  {...register("description")}
                  label="Description"
                  fullWidth
                  required
                  multiline
                  minRows={4}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Team Leader & Agent
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField {...register("teamLeaderName")} label="Team Leader Name" fullWidth required error={!!errors.teamLeaderName} helperText={errors.teamLeaderName?.message} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField {...register("teamLeaderEmail")} label="Team Leader Email" fullWidth required error={!!errors.teamLeaderEmail} helperText={errors.teamLeaderEmail?.message} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField {...register("agentName")} label="Agent Name" fullWidth required error={!!errors.agentName} helperText={errors.agentName?.message} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField {...register("agentEmail")} label="Agent Email" fullWidth required error={!!errors.agentEmail} helperText={errors.agentEmail?.message} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField {...register("agentId")} label="Agent ID" fullWidth required error={!!errors.agentId} helperText={errors.agentId?.message} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
              Supporting Documents
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Word, Excel, PDF, CSV, PNG, JPG — up to 20 MB each, multiple files allowed.
            </Typography>

            <Paper
              variant="outlined"
              sx={{ mt: 2, p: 3, textAlign: "center", borderStyle: "dashed", cursor: "pointer", bgcolor: "background.default" }}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadFileIcon sx={{ fontSize: 32, color: "text.secondary" }} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Click to browse or drag files here
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                accept=".doc,.docx,.xls,.xlsx,.pdf,.csv,.png,.jpg,.jpeg"
                onChange={(e) => onFilesSelected(e.target.files)}
              />
            </Paper>

            {files.length > 0 && (
              <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                {files.map((file, idx) => (
                  <Chip
                    key={`${file.name}-${idx}`}
                    icon={<InsertDriveFileIcon />}
                    label={`${file.name} (${(file.size / 1024).toFixed(0)} KB)`}
                    onDelete={() => removeFile(idx)}
                    deleteIcon={<CloseIcon />}
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate(-1)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
