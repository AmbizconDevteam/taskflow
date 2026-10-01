-- TaskFlow schema (PostgreSQL) — WordPress / digital marketing agency
-- v1 core: users, clients, projects, task types/templates, tasks, recurring, approvals
-- Included early to avoid later migrations: time tracking, comments, attachments, notifications

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- Enums ----------
CREATE TYPE user_role        AS ENUM ('admin', 'manager', 'member');
CREATE TYPE service_category AS ENUM ('wordpress', 'seo', 'ads', 'social', 'content', 'other');
CREATE TYPE task_status      AS ENUM (
  'backlog', 'assigned', 'in_progress', 'internal_review',
  'client_review', 'revision', 'approved', 'delivered', 'blocked'
);
CREATE TYPE task_priority    AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE project_status   AS ENUM ('active', 'on_hold', 'completed', 'cancelled');
CREATE TYPE approval_status  AS ENUM ('pending', 'approved', 'changes_requested');
CREATE TYPE recur_frequency  AS ENUM ('daily', 'weekly', 'monthly', 'quarterly');

-- ---------- Team ----------
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  email         text NOT NULL UNIQUE,
  password_hash text,                      -- null if using SSO / magic link
  role          user_role NOT NULL DEFAULT 'member',
  skills        service_category[] NOT NULL DEFAULT '{}',
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------- Clients ----------
CREATE TABLE clients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  contact_name  text,
  contact_email text,
  contact_phone text,
  website_url   text,
  assets_url    text,                      -- Google Drive / shared folder
  notes         text,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Services a client has bought (retainers)
CREATE TABLE client_services (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  category             service_category NOT NULL,
  monthly_hours        numeric(6,2),       -- retainer hours; null = one-off / project
  monthly_fee          numeric(12,2),
  starts_on            date,
  ends_on              date,
  UNIQUE (client_id, category)
);

-- WordPress site info (one client can have many sites)
CREATE TABLE client_sites (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  label          text NOT NULL,
  live_url       text,
  staging_url    text,
  hosting_provider text,
  credentials_ref  text,                   -- pointer to password manager entry; NEVER store raw passwords
  wp_version     text,
  notes          text
);

-- ---------- Projects ----------
CREATE TABLE projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  site_id     uuid REFERENCES client_sites(id) ON DELETE SET NULL,
  name        text NOT NULL,
  category    service_category NOT NULL,
  status      project_status NOT NULL DEFAULT 'active',
  manager_id  uuid REFERENCES users(id),
  start_date  date,
  due_date    date,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- Task types & templates ----------
CREATE TABLE task_types (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category  service_category NOT NULL,
  name      text NOT NULL,                 -- e.g. "New site build", "Monthly SEO report"
  default_estimate_hours numeric(6,2),
  UNIQUE (category, name)
);

CREATE TABLE task_type_checklist_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type_id uuid NOT NULL REFERENCES task_types(id) ON DELETE CASCADE,
  position     int  NOT NULL,
  label        text NOT NULL,
  UNIQUE (task_type_id, position)
);

-- ---------- Tasks ----------
CREATE TABLE tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id       uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,  -- denormalised for fast per-client views
  task_type_id    uuid REFERENCES task_types(id) ON DELETE SET NULL,
  parent_task_id  uuid REFERENCES tasks(id) ON DELETE CASCADE,             -- subtasks
  recurring_id    uuid,                                                    -- FK added below
  title           text NOT NULL,
  description     text,
  status          task_status NOT NULL DEFAULT 'backlog',
  priority        task_priority NOT NULL DEFAULT 'medium',
  assignee_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  created_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  due_date        date,
  estimated_hours numeric(6,2),
  blocked_reason  text,
  position        int NOT NULL DEFAULT 0,  -- order within kanban column
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tasks_assignee_status_idx ON tasks (assignee_id, status);
CREATE INDEX tasks_client_idx          ON tasks (client_id);
CREATE INDEX tasks_project_status_idx  ON tasks (project_id, status, position);
CREATE INDEX tasks_due_idx             ON tasks (due_date) WHERE status NOT IN ('delivered', 'approved');

CREATE TABLE task_checklist_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  position   int  NOT NULL,
  label      text NOT NULL,
  is_done    boolean NOT NULL DEFAULT false,
  done_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  done_at    timestamptz
);

-- Audit trail of status changes (needed for "how long did client review take")
CREATE TABLE task_status_history (
  id         bigserial PRIMARY KEY,
  task_id    uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  from_status task_status,
  to_status   task_status NOT NULL,
  changed_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  changed_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tags (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);
CREATE TABLE task_tags (
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id  uuid NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- ---------- Recurring tasks ----------
CREATE TABLE recurring_tasks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id     uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  task_type_id  uuid REFERENCES task_types(id) ON DELETE SET NULL,
  title         text NOT NULL,
  assignee_id   uuid REFERENCES users(id) ON DELETE SET NULL,
  frequency     recur_frequency NOT NULL,
  day_of_week   smallint CHECK (day_of_week BETWEEN 0 AND 6),    -- weekly
  day_of_month  smallint CHECK (day_of_month BETWEEN 1 AND 31),  -- monthly
  due_offset_days int NOT NULL DEFAULT 0,
  next_run_on   date NOT NULL,
  is_active     boolean NOT NULL DEFAULT true
);
ALTER TABLE tasks
  ADD CONSTRAINT tasks_recurring_fk FOREIGN KEY (recurring_id)
  REFERENCES recurring_tasks(id) ON DELETE SET NULL;

-- ---------- Client approvals (share-link, no login) ----------
CREATE TABLE approval_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  token         text NOT NULL UNIQUE,      -- long random string used in the share link
  status        approval_status NOT NULL DEFAULT 'pending',
  client_comment text,
  responded_by_name text,
  expires_at    timestamptz,
  created_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  responded_at  timestamptz
);

-- ---------- Comments & files ----------
CREATE TABLE comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  body        text NOT NULL,
  is_internal boolean NOT NULL DEFAULT true,   -- false = visible to client
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE attachments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  file_name   text NOT NULL,
  url         text NOT NULL,               -- object storage / Drive link
  mime_type   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- Time tracking ----------
CREATE TABLE time_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at  timestamptz,
  minutes     int NOT NULL CHECK (minutes > 0),
  note        text,
  logged_on   date NOT NULL DEFAULT current_date
);
CREATE INDEX time_entries_task_idx ON time_entries (task_id);
CREATE INDEX time_entries_user_day_idx ON time_entries (user_id, logged_on);

-- ---------- Notifications ----------
CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id    uuid REFERENCES tasks(id) ON DELETE CASCADE,
  kind       text NOT NULL,                -- assigned | due_soon | overdue | client_approved | client_rejected | comment
  message    text NOT NULL,
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_unread_idx ON notifications (user_id) WHERE NOT is_read;

-- ---------- Keep tasks.updated_at fresh ----------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_set_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
