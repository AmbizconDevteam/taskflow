import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { Avatar, PriorityChip, fmtDate, isOverdue } from '../components/ui';
import { TaskModal } from './TaskModal';

export default function Overview() {
  const { me, tasks, user, client, isLead, isAdmin } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const scope = tasks.filter((t) => !t.incoming && (isLead || t.team === me.team || t.assigneeId === me.id));
  const mine = scope.filter((t) => t.assigneeId === me.id && t.status !== 'done');
  const toReview = tasks.filter((t) => t.status === 'review' && (t.reviewerId === me.id || (isAdmin && !t.reviewerId)));
  const toSign = tasks.filter((t) => t.creationApproval === 'pending' && (isAdmin || (me.role === 'team_lead' && t.team === me.team)));
  const overdue = scope.filter(isOverdue);
  const revisions = mine.filter((t) => t.revision && t.status === 'in_progress');

  const list = (title: string, items: typeof tasks, empty: string) => (
    <div className="card">
      <div className="row" style={{ marginBottom: 10 }}><h3>{title}</h3><span className="count-pill">{items.length}</span></div>
      {items.length === 0 && <div className="empty">{empty}</div>}
      {items.slice(0, 5).map((t) => (
        <button key={t.id} onClick={() => setOpen(t.id)} className="row" style={{ width: '100%', background: 'none', border: 0, borderBottom: '1px solid var(--border)', padding: '10px 0', textAlign: 'left' }}>
          <Avatar user={user(t.assigneeId)} />
          <div className="grow"><b>{t.title}</b><div className="muted" style={{ fontSize: 12 }}>{client(t.clientId)?.name} · due {fmtDate(t.due)}</div></div>
          <PriorityChip p={t.priority} />
        </button>
      ))}
    </div>
  );

  return (
    <>
      <h1 className="page-title">Good day, {me.name.split(' ')[0]} 👋</h1>
      <p className="page-sub">Here is what needs your attention across the workspace.</p>
      <div className="grid g4" style={{ marginBottom: 16 }}>
        <div className="card stat"><b>{mine.length}</b><span>Assigned to me</span></div>
        <div className="card stat"><b style={{ color: overdue.length ? 'var(--red)' : undefined }}>{overdue.length}</b><span>Overdue</span></div>
        <div className="card stat"><b>{toReview.length}</b><span>Waiting for my review</span></div>
        <div className="card stat"><b>{revisions.length}</b><span>Revisions to fix</span></div>
      </div>
      <div className="grid g2">
        {list('My tasks', mine, 'Nothing assigned — enjoy the calm.')}
        {list('Needs my review', toReview, 'No deliverables waiting for you.')}
        {isLead && list('Awaiting sign-off', toSign, 'No new tasks to approve.')}
        {list('Overdue', overdue, 'Nothing overdue 🎉')}
      </div>
      <p style={{ marginTop: 20 }}><Link to="/board">Open Bizzy Board <ArrowRight size={14} style={{ verticalAlign: -2 }} /></Link></p>
      {open && <TaskModal id={open} onClose={() => setOpen(null)} />}
    </>
  );
}
