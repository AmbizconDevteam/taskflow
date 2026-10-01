import { AlertTriangle, CalendarDays, Kanban, ListChecks, Paperclip, Plus, Search, Tag, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import type { Priority, Status, Task, Team } from '../types';
import { Avatar, PriorityChip, fmtDate, isOverdue, statusMeta, subProgress } from '../components/ui';
import { TaskModal } from './TaskModal';
import { CreateTaskModal } from './CreateTask';

export function TaskCard({ t, onOpen, draggable = true }: { t: Task; onOpen: () => void; draggable?: boolean }) {
  const { user, client } = useStore();
  const c = client(t.clientId);
  const sp = subProgress(t);
  const [drag, setDrag] = useState(false);
  return (
    <div
      className={`tcard ${drag ? 'dragging' : ''}`}
      draggable={draggable}
      onDragStart={(e) => { e.dataTransfer.setData('text/task', t.id); e.dataTransfer.effectAllowed = 'move'; setDrag(true); }}
      onDragEnd={() => setDrag(false)}
      onClick={onOpen}
    >
      {t.revision && t.status === 'in_progress' && <div className="alert-rev"><AlertTriangle size={13} /> ⚠️ REVISIONS REQUESTED</div>}
      <div className="row wrap" style={{ gap: 6 }}>
        <PriorityChip p={t.priority} />
        {c && <span className="chip client">{c.short}</span>}
        {t.creationApproval === 'pending' && <span className="chip approval">PENDING APPROVAL</span>}
        <span className="chip team">{t.team}</span>
      </div>
      <h4>{t.title}</h4>
      <p>{t.description}</p>
      <div className="row wrap" style={{ gap: 6 }}>
        {t.labels.map((l) => <span key={l} className="chip"><Tag size={11} />{l}</span>)}
      </div>
      {sp.total > 0 && <div className="bar" style={{ marginTop: 10 }}><i style={{ width: `${(sp.done / sp.total) * 100}%` }} /></div>}
      <div className="meta">
        {t.due && <span className={isOverdue(t) ? 'over' : ''}><CalendarDays size={13} />{fmtDate(t.due)}</span>}
        {sp.total > 0 && <span><ListChecks size={13} />{sp.done}/{sp.total}</span>}
        {t.attachments.length > 0 && <span><Paperclip size={13} />{t.attachments.length}</span>}
        <span className="right"><Avatar user={user(t.assigneeId)} /></span>
      </div>
    </div>
  );
}

export default function Board() {
  const { tasks, me, users, clients, moveTask, isLead, isAdmin, toast } = useStore();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [mode, setMode] = useState<'all' | 'created' | 'assigned'>('all');
  const [tl, setTl] = useState('all');
  const [team, setTeam] = useState<'all' | Team>('all');
  const [pri, setPri] = useState<'all' | Priority>('all');
  const [client, setClient] = useState('all');
  const [label, setLabel] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [over, setOver] = useState<Status | null>(null);
  const [reviewFor, setReviewFor] = useState<string | null>(null);

  // Members only see their own team; leads and admins see everything they scope into.
  const base = useMemo(() => tasks.filter((t) => !t.incoming && (isLead || t.team === me.team || t.assigneeId === me.id || t.createdBy === me.id)), [tasks, isLead, me]);
  const labels = useMemo(() => [...new Set(base.flatMap((t) => t.labels))].sort(), [base]);

  const visible = base.filter((t) => {
    if (mode === 'created' && t.createdBy !== me.id) return false;
    if (mode === 'assigned' && t.assigneeId !== me.id) return false;
    if (tl !== 'all' && t.assigneeId !== tl) return false;
    if (team !== 'all' && t.team !== team) return false;
    if (pri !== 'all' && t.priority !== pri) return false;
    if (client !== 'all' && t.clientId !== client) return false;
    if (label && !t.labels.includes(label)) return false;
    const needle = q.trim().toLowerCase();
    if (needle && !`${t.title} ${t.description} ${t.labels.join(' ')}`.toLowerCase().includes(needle)) return false;
    return true;
  });

  const createdByMe = base.filter((t) => t.createdBy === me.id).length;
  const assignedToMe = base.filter((t) => t.assigneeId === me.id).length;
  const onDrop = (to: Status, e: React.DragEvent) => {
    e.preventDefault();
    setOver(null);
    const id = e.dataTransfer.getData('text/task');
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    if (to === 'review' && !t.reviewerId) { setReviewFor(id); setOpenId(id); return; }
    if (moveTask(id, to) && to === 'done') toast('Marked complete 🎉');
  };

  return (
    <>
      <section className="hero">
        <div className="hero-icon"><Kanban size={30} /></div>
        <div className="grow">
          <div className="row"><h1>{isLead ? 'Global Workspace Bizzy Board' : 'My Bizzy Board'}</h1><span className="count-pill">{base.length} Active Cards</span></div>
          <p className="muted" style={{ margin: '6px 0 0' }}>Drag and drop cards across columns • Track creation history &amp; team workload in real time.</p>
        </div>
        <button className="btn primary" style={{ height: 48 }} onClick={() => setCreating(true)}><Plus size={18} /> Create Task</button>
      </section>

      <section className="filters">
        <label className="search" style={{ width: 340, height: 42 }}>
          <Search size={16} /><input placeholder="Search by title, label (e.g. Figma, Mobile)…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <span className="lbl">TRACK MODE:</span>
        <select className="select" value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
          <option value="all">All Workspace Tasks ({base.length})</option>
          <option value="created">Tasks Created By Me ({createdByMe})</option>
          <option value="assigned">Tasks Assigned To Me ({assignedToMe})</option>
        </select>
        {isLead && (<>
          <span className="lbl">TL WORKLOAD VIEW:</span>
          <select className="select green" value={tl} onChange={(e) => setTl(e.target.value)}>
            <option value="all">Whole Team Tasks</option>
            {users.filter((u) => u.role !== 'reception' && (isAdmin || u.team === me.team)).map((u) => <option key={u.id} value={u.id}>{u.name}'s Tasks</option>)}
          </select>
        </>)}
        <select className="select" value={team} onChange={(e) => setTeam(e.target.value as typeof team)}>
          <option value="all">All Workspace Teams</option><option>Development</option><option>Marketing</option><option>Creative</option>
        </select>
        <select className="select" value={pri} onChange={(e) => setPri(e.target.value as typeof pri)}>
          <option value="all">All Priorities</option>{(['low', 'medium', 'high', 'critical', 'urgent'] as Priority[]).map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
        </select>
        <select className="select" value={client} onChange={(e) => setClient(e.target.value)}>
          <option value="all">All Clients</option>{clients.filter((c) => c.approved).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </section>

      <div className="row wrap" style={{ marginBottom: 18 }}>
        <b className="muted" style={{ letterSpacing: '0.1em', fontSize: 13 }}>QUICK LABEL FILTERS:</b>
        <button className={`chip filter ${mode === 'assigned' ? 'on' : ''}`} onClick={() => setMode(mode === 'assigned' ? 'all' : 'assigned')}><Zap size={13} /> Assigned to Me</button>
        <button className={`chip filter ${mode === 'created' ? 'on' : ''}`} onClick={() => setMode(mode === 'created' ? 'all' : 'created')}>Created By Me ({createdByMe})</button>
        {labels.map((l) => <button key={l} className={`chip filter ${label === l ? 'on' : ''}`} onClick={() => setLabel(label === l ? null : l)}><Tag size={13} />{l}</button>)}
      </div>

      <div className="board">
        {statusMeta.map((col) => {
          const list = visible.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className={`column ${over === col.key ? 'over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setOver(col.key); }} onDragLeave={() => setOver((o) => (o === col.key ? null : o))} onDrop={(e) => onDrop(col.key, e)}>
              <div className="col-head"><i className="dot" style={{ background: col.color }} />{col.label}<span className="n">{list.length}</span></div>
              {list.length === 0 && <div className="empty">No tasks in {col.label}</div>}
              {list.map((t) => <TaskCard key={t.id} t={t} onOpen={() => setOpenId(t.id)} />)}
            </div>
          );
        })}
      </div>

      {openId && <TaskModal id={openId} startReview={reviewFor === openId} onClose={() => { setOpenId(null); setReviewFor(null); }} />}
      {creating && <CreateTaskModal onClose={() => setCreating(false)} />}
    </>
  );
}
