import { Check, Inbox, X } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store';
import { Avatar, Field, Modal, PriorityChip, fmtDate } from '../components/ui';

export default function Queue() {
  const { tasks, me, users, user, client, isLead, isAdmin, patchTask, deleteTask, toast } = useStore();
  const items = tasks.filter((t) => t.incoming && (isAdmin || t.team === me.team));
  const [accept, setAccept] = useState<string | null>(null);
  const [assignee, setAssignee] = useState('');
  const target = tasks.find((t) => t.id === accept);

  return (
    <>
      <h1 className="page-title row"><Inbox /> Incoming Queue</h1>
      <p className="page-sub">Cross-team requests routed to {isAdmin ? 'any team' : `the ${me.team} team`}. Accept to move them onto the board.</p>
      {items.length === 0 && <div className="empty">Queue is empty.</div>}
      <div className="grid g2">
        {items.map((t) => (
          <div key={t.id} className="card col">
            <div className="row wrap"><PriorityChip p={t.priority} /><span className="chip client">{client(t.clientId)?.name}</span><span className="chip team">{t.team}</span></div>
            <h3>{t.title}</h3>
            <p className="muted" style={{ margin: 0 }}>{t.description}</p>
            <div className="row muted" style={{ fontSize: 13 }}><Avatar user={user(t.createdBy)} /> Requested by {user(t.createdBy)?.name} · due {fmtDate(t.due)}</div>
            {isLead
              ? <div className="row"><button className="btn good sm" onClick={() => { setAccept(t.id); setAssignee(''); }}><Check size={14} /> Accept &amp; assign</button>
                <button className="btn soft-danger sm" onClick={() => { deleteTask(t.id); toast('Request declined'); }}><X size={14} /> Decline</button></div>
              : <span className="muted">Only Team Leads can accept requests.</span>}
          </div>
        ))}
      </div>
      {target && (
        <Modal size="sm" title="Accept request" onClose={() => setAccept(null)}
          footer={<><button className="btn" onClick={() => setAccept(null)}>Cancel</button><button className="btn primary" onClick={() => { patchTask(target.id, { incoming: false, status: assignee ? 'todo' : 'backlog', assigneeId: assignee || undefined }, `Accepted request${assignee ? ` and assigned to ${user(assignee)?.name}` : ''}`); toast('Moved onto the board'); setAccept(null); }}>Accept</button></>}>
          <Field label="Assign to"><select className="select" value={assignee} onChange={(e) => setAssignee(e.target.value)}><option value="">Leave unassigned (Backlog)</option>{users.filter((u) => u.team === target.team).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
        </Modal>
      )}
    </>
  );
}
