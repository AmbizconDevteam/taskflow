import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AttendanceDay, BreakKind, Claim, Client, HistoryEntry, RoleRequest, Status, Task, User } from './types';
import * as seed from './data/seed';

interface State {
  users: User[];
  clients: Client[];
  tasks: Task[];
  attendance: Record<string, AttendanceDay[]>;
  claims: Claim[];
  roleRequests: RoleRequest[];
  meId: string;
  theme: 'light' | 'dark';
}

const KEY = 'bizzy-board-v1';
const initial = (): State => ({
  users: seed.users, clients: seed.clients, tasks: seed.tasks, attendance: seed.attendance,
  claims: seed.claims, roleRequests: seed.roleRequests, meId: 'u1', theme: 'light',
});
const load = (): State => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initial(), ...JSON.parse(raw) };
  } catch { /* storage unavailable or corrupt: fall back to seed */ }
  return initial();
};

export interface Toast { id: number; text: string; kind: 'ok' | 'err' }

interface Ctx extends State {
  me: User;
  isLead: boolean;
  isAdmin: boolean;
  toasts: Toast[];
  toast: (text: string, kind?: Toast['kind']) => void;
  user: (id?: string) => User | undefined;
  client: (id?: string) => Client | undefined;
  setMe: (id: string) => void;
  toggleTheme: () => void;
  resetDemo: () => void;
  addTask: (t: Task) => void;
  patchTask: (id: string, patch: Partial<Task> | ((t: Task) => Partial<Task>), log?: string) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, to: Status) => boolean;
  canSignOff: (t: Task) => boolean;
  addClient: (name: string) => string;
  patchClient: (id: string, patch: Partial<Client>) => void;
  patchUser: (id: string, patch: Partial<User>) => void;
  deleteUser: (id: string) => void;
  clockIn: () => void;
  clockOut: () => void;
  startBreak: (k: BreakKind) => void;
  endBreak: () => void;
  requestCorrection: (date: string, note: string) => void;
  addClaim: (c: Claim) => void;
  patchClaim: (id: string, patch: Partial<Claim>) => void;
  decideRole: (id: string, ok: boolean) => void;
}

const StoreCtx = createContext<Ctx | null>(null);
export const useStore = () => {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore outside provider');
  return c;
};

const hist = (userId: string, text: string): HistoryEntry => ({ id: seed.uid('h'), userId, text, at: new Date().toISOString() });

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(load);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* quota exceeded by large attachments: keep in memory only */ }
    document.documentElement.dataset.theme = s.theme;
  }, [s]);

  const me = s.users.find((u) => u.id === s.meId) ?? s.users[0];
  const isAdmin = me.role === 'super_admin';
  const isLead = isAdmin || me.role === 'team_lead';

  const toast = useCallback((text: string, kind: Toast['kind'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const patchTask: Ctx['patchTask'] = useCallback((id, patch, log) => {
    setS((st) => ({
      ...st,
      tasks: st.tasks.map((t) => {
        if (t.id !== id) return t;
        const p = typeof patch === 'function' ? patch(t) : patch;
        return { ...t, ...p, history: log ? [...(p.history ?? t.history), hist(st.meId, log)] : (p.history ?? t.history) };
      }),
    }));
  }, []);

  const canSignOff = useCallback((t: Task) => isAdmin || (me.role === 'team_lead' && me.team === t.team), [isAdmin, me]);

  const value: Ctx = useMemo(() => ({
    ...s, me, isLead, isAdmin, toasts, toast,
    user: (id) => s.users.find((u) => u.id === id),
    client: (id) => s.clients.find((c) => c.id === id),
    setMe: (id) => setS((st) => ({ ...st, meId: id })),
    toggleTheme: () => setS((st) => ({ ...st, theme: st.theme === 'light' ? 'dark' : 'light' })),
    resetDemo: () => { setS(initial()); toast('Demo data reset'); },
    addTask: (t) => setS((st) => ({ ...st, tasks: [t, ...st.tasks] })),
    patchTask,
    deleteTask: (id) => setS((st) => ({ ...st, tasks: st.tasks.filter((t) => t.id !== id) })),
    canSignOff,
    moveTask: (id, to) => {
      const t = s.tasks.find((x) => x.id === id);
      if (!t || t.status === to) return false;
      if (t.creationApproval === 'pending' && to !== 'backlog' && to !== 'todo') { toast('Waiting for Team Lead sign-off before work can start', 'err'); return false; }
      if (to === 'done' && t.reviewerId && t.reviewerId !== me.id && !isAdmin) { toast('Only the assigned reviewer can mark this Done', 'err'); return false; }
      if (to === 'done' && !t.reviewerId && !isLead) { toast('Submit for review first — a reviewer must sign off', 'err'); return false; }
      patchTask(id, { status: to, completedAt: to === 'done' ? new Date().toISOString() : undefined }, `Moved from ${t.status.replace('_', ' ')} to ${to.replace('_', ' ')}`);
      return true;
    },
    addClient: (name) => {
      const id = seed.uid('c');
      const approved = isAdmin;
      setS((st) => ({ ...st, clients: [...st.clients, { id, name, short: name.split(' ')[0], approved, addedBy: me.id, sites: [], services: [], projects: [] }] }));
      toast(approved ? `Client "${name}" added` : `"${name}" sent to admin approval queue`);
      return id;
    },
    patchClient: (id, patch) => setS((st) => ({ ...st, clients: st.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
    patchUser: (id, patch) => setS((st) => ({ ...st, users: st.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),
    deleteUser: (id) => setS((st) => ({
      ...st,
      users: st.users.filter((u) => u.id !== id),
      tasks: st.tasks.map((t) => (t.assigneeId === id ? { ...t, assigneeId: undefined } : t)),
    })),
    clockIn: () => setS((st) => {
      const list = st.attendance[st.meId] ?? [];
      const today = seed.day(0);
      if (list.some((d) => d.date === today)) return st;
      return { ...st, attendance: { ...st.attendance, [st.meId]: [{ date: today, clockIn: new Date().toISOString(), breaks: [] }, ...list] } };
    }),
    clockOut: () => setS((st) => ({
      ...st,
      attendance: {
        ...st.attendance,
        [st.meId]: (st.attendance[st.meId] ?? []).map((d) => {
          if (d.date !== seed.day(0)) return d;
          const now = new Date().toISOString();
          return { ...d, clockOut: now, breaks: d.breaks.map((b) => (b.end ? b : { ...b, end: now })) };
        }),
      },
    })),
    startBreak: (kind) => setS((st) => ({
      ...st,
      attendance: {
        ...st.attendance,
        [st.meId]: (st.attendance[st.meId] ?? []).map((d) => (d.date === seed.day(0) && !d.breaks.some((b) => !b.end) ? { ...d, breaks: [...d.breaks, { kind, start: new Date().toISOString() }] } : d)),
      },
    })),
    endBreak: () => setS((st) => ({
      ...st,
      attendance: {
        ...st.attendance,
        [st.meId]: (st.attendance[st.meId] ?? []).map((d) => (d.date === seed.day(0) ? { ...d, breaks: d.breaks.map((b) => (b.end ? b : { ...b, end: new Date().toISOString() })) } : d)),
      },
    })),
    requestCorrection: (date, note) => setS((st) => ({
      ...st,
      attendance: { ...st.attendance, [st.meId]: (st.attendance[st.meId] ?? []).map((d) => (d.date === date ? { ...d, correction: { note, status: 'pending' } } : d)) },
    })),
    addClaim: (c) => setS((st) => ({ ...st, claims: [c, ...st.claims] })),
    patchClaim: (id, patch) => setS((st) => ({ ...st, claims: st.claims.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
    decideRole: (id, ok) => setS((st) => {
      const r = st.roleRequests.find((x) => x.id === id);
      if (!r) return st;
      return {
        ...st,
        roleRequests: st.roleRequests.map((x) => (x.id === id ? { ...x, status: ok ? 'approved' : 'rejected' } : x)),
        users: ok ? st.users.map((u) => (u.id === r.userId ? { ...u, role: r.to } : u)) : st.users,
      };
    }),
  }), [s, me, isLead, isAdmin, toasts, toast, patchTask, canSignOff]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
