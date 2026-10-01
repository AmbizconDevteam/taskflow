# Bizzy Board (TaskFlow) — new UI

Redesigned front end for the Ambizcon agency workspace. Keeps the existing colour theme
(deep teal primary, olive-green active nav, lavender hero, light + dark mode).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build (Vercel-ready, SPA rewrite in vercel.json)
```

## Status: UI prototype on mock data

All data lives in `src/data/seed.ts` and is persisted to `localStorage` (key `bizzy-board-v1`).
There is **no backend or auth yet**. Types in `src/types.ts` mirror the MongoDB collections
(`approvalToken`, `credentialsRef`, `isInternal`/`internal`, `pending_approval`, …) so `src/store.tsx`
can be swapped for API calls. Use the avatar menu (top bar, branch pill) to switch persona and
see role-based behaviour; **Reset demo data** restores the seed.

## What is implemented

| Area | Where |
|---|---|
| 6-column Kanban, drag & drop, counts, search, track mode, TL workload view, team/priority/client/label filters | `pages/Board.tsx` |
| Task card: client badge, avatar, due/overdue, subtask ratio, attachments, `⚠️ REVISIONS REQUESTED` | `pages/Board.tsx` |
| Task modal: subtasks, attachments (+ image thumbnails), time logger, threaded comments (internal toggle), audit history | `pages/TaskModal.tsx` |
| Creation sign-off (members → Team Lead / Super Admin) | `store.tsx`, `TaskModal.tsx` |
| 360° reviewer pick, Approve / Request Changes (in-app modal) → back to In Progress with banner + Re-Submit | `TaskModal.tsx` |
| In-app modals only (no `confirm`/`prompt`): request changes, delete task, delete user | `components/ui.tsx` |
| Template engine (5 agency templates), client/project link, new-client approval queue, cross-team routing, recurring, <5MB file validation | `pages/CreateTask.tsx`, `data/seed.ts` |
| Public client share link `/share/:token` (no login) | `pages/Share.tsx` |
| Incoming Queue | `pages/Queue.tsx` |
| Clock in/out, breaks, corrections, CSV export | `pages/Attendance.tsx` |
| Reimbursements with TL → CEO → Admin → Paid chain | `pages/Reimbursements.tsx` |
| Client site vault (vault pointers only) + retainers | `pages/Clients.tsx` |
| Analytics, Reports (CSV) | `pages/Insights.tsx` |
| User directory, role approvals, company finance | `pages/Admin.tsx` |
| Profile (non-sensitive fields only; email/role read-only), settings | `pages/Profile.tsx` |

## Not built yet

Real auth, MongoDB/API wiring, file storage (attachments are kept as data URLs, so large
uploads can exceed the localStorage quota), email/WhatsApp notifications, real QR scanning,
Excel export (CSV only), leave management beyond attendance.

`db/` contains an earlier **PostgreSQL** draft. The live product uses MongoDB, so treat it as a
reference for field design only.
