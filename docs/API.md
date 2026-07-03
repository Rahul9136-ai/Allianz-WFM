# WFM Request Portal — REST API Reference

Base URL: `http://localhost:4000/api`

All authenticated endpoints require a Bearer token:

```
Authorization: Bearer <jwt>
```

Standard response envelope:

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "…", "details": { ... } }
```

---

## Auth

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/login` | public | Email + password → JWT. Rate-limited. |
| GET | `/auth/me` | any | Current user profile. |
| POST | `/auth/change-password` | any | Change own password. |
| POST | `/auth/logout` | any | Client discards token. |
| GET | `/auth/azure/login` | public | Azure AD SSO (501 until configured). |

**Login body:** `{ "email": "ops@wfmportal.com", "password": "Password123!" }`

---

## Requests (Tickets)

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/requests` | any | List (Operations scoped to own). Query: `page, pageSize, search, status, priority, categoryId, vendorId, assignedToId, slaStatus, sortBy, sortDir, mine`. |
| POST | `/requests` | any | Create request → auto ticket number. |
| GET | `/requests/:id` | owner/WFM/Admin | Ticket detail with live SLA status. |
| PATCH | `/requests/:id` | WFM/Admin | WFM panel update (status, assignee, notes, dates, priority). |
| POST | `/requests/bulk-update` | WFM/Admin | Bulk status/assignment change. |
| GET | `/requests/:id/history` | owner/WFM/Admin | Activity timeline. |
| GET | `/requests/:id/audit` | WFM/Admin | Immutable audit trail. |

**Create body:**
```json
{
  "categoryId": "<uuid>",
  "vendorId": "<uuid>",
  "effectiveDate": "2026-07-10",
  "description": "Shift swap for weekend coverage",
  "teamLeaderName": "Taylor Lead",
  "teamLeaderEmail": "taylor@example.com",
  "agentName": "Sam Agent",
  "agentEmail": "sam@example.com",
  "agentId": "AG-1024",
  "priority": "HIGH"
}
```

---

## Comments

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/requests/:id/comments` | owner/WFM/Admin | Thread (Operations sees non-internal only). |
| POST | `/requests/:id/comments` | owner/WFM/Admin | Add comment. `isInternal` restricted to WFM/Admin. |

Body: `{ "body": "Looking into this now", "isInternal": false }`

---

## Attachments

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/requests/:id/attachments` | owner/WFM/Admin | List files. |
| POST | `/requests/:id/attachments` | owner/WFM/Admin | Multipart upload (`files[]`), ≤20 MB each. |
| GET | `/requests/:id/attachments/:attachmentId/download` | owner/WFM/Admin | Download original file. |

Allowed types: Word, Excel, PDF, CSV, PNG, JPG.

---

## Reference Data

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/categories` | any | List categories. |
| POST/PATCH | `/categories[/:id]` | Admin | Manage categories. |
| GET | `/vendors` | any | List vendors. |
| POST/PATCH | `/vendors[/:id]` | Admin | Manage vendors. |

---

## Users (Admin)

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/users` | any (auth) | List users (for assignee dropdowns). |
| POST | `/users` | Admin | Create user. |
| PATCH | `/users/:id` | Admin | Update role / active status. |
| DELETE | `/users/:id` | Admin | Deactivate user. |

---

## Notifications

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/notifications` | any | Current user's notifications. |
| PATCH | `/notifications/:id/read` | any | Mark one read. |
| POST | `/notifications/read-all` | any | Mark all read. |

---

## Dashboard & Audit

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/dashboard` | any | KPIs + chart aggregates (Operations scoped to own). |
| GET | `/audit-logs` | WFM/Admin | Paginated system-wide audit log. |

---

## Status & Enum Values

- **Status:** `PENDING`, `ASSIGNED`, `IN_PROGRESS`, `WAITING_FOR_INFORMATION`, `COMPLETED`, `REJECTED`, `CANCELLED`
- **Priority:** `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- **SLA Status (computed):** `WITHIN_SLA` (green), `AT_RISK` (amber, <24h), `OVERDUE` (red), `MET`, `BREACHED`

## Error Codes

| Code | Meaning |
| --- | --- |
| 400 | Validation error (Zod) |
| 401 | Missing / expired token |
| 403 | Role not permitted |
| 404 | Not found |
| 409 | Duplicate (unique constraint) |
| 429 | Rate limit exceeded |
