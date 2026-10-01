import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import type { Priority, Status, Task, User } from '../types';

const palette = ['#0b5f6d', '#86a23b', '#8b5cf6', '#d63a52', '#2f7de1', '#f2711c', '#22a06b', '#b45f9e'];
export const initials = (n: string) => n.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
export const colorOf = (s: string) => palette[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];

export function Avatar({ user, large }: { user?: Pick<User, 'name'>; large?: boolean }) {
  if (!user) return <div className={`avatar ${large ? 'lg' : ''}`} style={{ background: 'var(--border)', color: 'var(--muted)' }}>?</div>;
  return <div className={`avatar ${large ? 'lg' : ''}`} style={{ background: colorOf(user.name) }} title={user.name}>{initials(user.name)}</div>;
}

export function Modal({ title, onClose, children, footer, size, icon }: { title: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'wide'; icon?: ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size ?? ''}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          {icon}
          <h2 className="grow">{title}</h2>
          <button className="btn icon ghost" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="field"><label>{label}</label>{children}</div>
);

export const priorityLabel: Record<Priority, string> = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical', urgent: 'Urgent' };
export const PriorityChip = ({ p }: { p: Priority }) => <span className={`chip pri-${p}`}>{priorityLabel[p]}</span>;

export const statusMeta: { key: Status; label: string; color: string }[] = [
  { key: 'backlog', label: 'Backlog', color: '#8b97a6' },
  { key: 'todo', label: 'To Do', color: '#3f4b59' },
  { key: 'in_progress', label: 'In Progress', color: '#2f7de1' },
  { key: 'review', label: 'Review / Testing', color: '#8b5cf6' },
  { key: 'support', label: 'Support', color: '#f2711c' },
  { key: 'done', label: 'Completed', color: '#22a06b' },
];

export const fmtDate = (s?: string) => (s ? new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
export const fmtTime = (s?: string) => (s ? new Date(s).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—');
export const fmtMoney = (n: number) => '₹' + n.toLocaleString('en-IN');
export const isOverdue = (t: Task) => !!t.due && t.status !== 'done' && new Date(t.due + 'T23:59:59') < new Date();
export const loggedHours = (t: Task) => t.timeEntries.reduce((a, e) => a + e.hours, 0);
export const subProgress = (t: Task) => ({ done: t.subtasks.filter((s) => s.done).length, total: t.subtasks.length });

export const MAX_FILE = 5 * 1024 * 1024;
export const ALLOWED_EXT = ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'zip', 'xlsx', 'txt', 'svg', 'webp', 'gif'];
export function validateFile(f: File): string | null {
  if (f.size > MAX_FILE) return `${f.name} is over 5MB`;
  const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXT.includes(ext)) return `.${ext} files are not allowed (PDF, PNG, JPG, DOC, ZIP, XLSX, TXT)`;
  return null;
}
export const readDataUrl = (f: File) => new Promise<string | undefined>((res) => {
  if (!f.type.startsWith('image/')) return res(undefined);
  const r = new FileReader();
  r.onload = () => res(r.result as string);
  r.onerror = () => res(undefined);
  r.readAsDataURL(f);
});

export function download(name: string, text: string, mime = 'text/csv') {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
export const csv = (rows: (string | number)[][]) => rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
