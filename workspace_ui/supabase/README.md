# Supabase migrations

Run these scripts in **Supabase Dashboard → SQL Editor** (paste the full file and click Run).

## Order

1. `user_feedback.sql` — only if `user_feedback` is not set up yet
2. **`university_upgrade.sql`** — departments, workspace types, room/lab reservations

## Before you run `university_upgrade.sql`

### Do you need to export data first?

| Situation | Recommendation |
|-----------|----------------|
| Empty or dev project | Run the migration directly. No export needed. |
| Production with real users/workspaces | **Backup first.** Supabase → Project Settings → Database → backup, or export key tables (`workspaces`, `users`, `resource`, `borrow_request`) as CSV. |
| You want me to write custom data migration | Export schema + sample rows and share them. Not required for this upgrade. |

This migration is **additive**. Existing rows stay intact. All current workspaces become `workspace_type = EQUIPMENT` until you change them in the app.

### After running the migration

1. Confirm tables exist: `departments`, `reservations`
2. Confirm `workspaces` has new columns: `workspace_type`, `department_id`, `building`, `room_number`, `capacity`, etc.
3. Confirm functions exist: `create_reservation`, `review_reservation`, `has_reservation_conflict`
4. Redeploy or refresh the Vercel app after pushing UI changes

### RPC permissions

If `create_reservation` fails with a permission error, grant execute to authenticated users:

```sql
grant execute on function public.create_reservation(uuid, uuid, timestamptz, timestamptz, text) to authenticated;
grant execute on function public.review_reservation(uuid, uuid, text) to authenticated;
grant execute on function public.has_reservation_conflict(uuid, timestamptz, timestamptz, uuid) to authenticated;
```

### Workspace types

| Type | Use |
|------|-----|
| `ROOM` | Study rooms, meeting rooms — time-slot reservations |
| `LAB` | Teaching/research labs — reservations + equipment |
| `EQUIPMENT` | Shared gear pools — existing borrow/approval flow |

