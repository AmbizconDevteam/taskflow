// Shapes mirror the existing MongoDB collections so the UI can later be wired to the real API.

export type Role = 'super_admin' | 'team_lead' | 'member' | 'reception';
export type Team = 'Development' | 'Marketing' | 'Creative';
export type Branch = 'Ambizcon Health - India' | 'Ambizcon' | 'India & Australia';
export type Status = 'backlog' | 'todo' | 'in_progress' | 'review' | 'support' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'critical' | 'urgent';
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  team?: Team;
  branch: Branch;
  phone?: string;
  emergencyContact?: string;
  address?: string;
  bloodGroup?: string;
  qualification?: string;
  experience?: string;
  skills?: string;
  workMode?: 'Office' | 'Remote' | 'Hybrid';
  birthday?: string;
}

export interface ClientSite {
  id: string;
  label: string;
  liveUrl: string;
  stagingUrl?: string;
  host: string;
  credentialsRef: string; // 1Password / Bitwarden pointer, never a raw password
  notes?: string;
}

export interface ClientService {
  name: string;
  monthlyHours: number;
  monthlyFee: number;
}

export interface Client {
  id: string;
  name: string;
  short: string;
  approved: boolean; // clients added by Team Leads wait in the admin queue
  addedBy?: string;
  sites: ClientSite[];
  services: ClientService[];
  projects: { id: string; name: string }[];
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
}

export interface Comment {
  id: string;
  userId: string;
  body: string;
  internal: boolean;
  at: string;
}

export interface HistoryEntry {
  id: string;
  userId: string;
  text: string;
  at: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  hours: number;
  note: string;
  at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  team: Team;
  clientId: string;
  projectId?: string;
  assigneeId?: string;
  createdBy: string;
  reviewerId?: string;
  labels: string[];
  due?: string;
  estHours: number;
  timeEntries: TimeEntry[];
  subtasks: Subtask[];
  attachments: Attachment[];
  comments: Comment[];
  history: HistoryEntry[];
  recurring?: Frequency;
  creationApproval: 'pending' | 'approved'; // member-created tasks need lead sign-off
  incoming: boolean; // cross-team request waiting in the target team's queue
  revision?: { note: string; by: string; at: string };
  approvalToken: string; // public client share link
  clientDecision?: { decision: 'approved' | 'changes'; note: string; name: string; at: string };
  createdAt: string;
  completedAt?: string;
}

export interface AttendanceDay {
  date: string;
  clockIn?: string; // ISO
  clockOut?: string;
  breaks: { kind: BreakKind; start: string; end?: string }[];
  correction?: { note: string; status: 'pending' | 'approved' | 'rejected' };
}
export type BreakKind = 'Lunch' | 'Tea' | 'Personal' | 'Meeting';

export interface Claim {
  id: string;
  userId: string;
  title: string;
  category: 'Travel' | 'Meals' | 'Software' | 'Equipment' | 'Client Visit' | 'Other';
  amount: number;
  date: string;
  receipt?: string;
  state: 'draft' | 'submitted' | 'tl_approved' | 'ceo_approved' | 'admin_approved' | 'rejected' | 'paid';
}

export interface RoleRequest {
  id: string;
  userId: string;
  from: Role;
  to: Role;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}
