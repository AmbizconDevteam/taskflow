import { BarChart3, Download, FileBarChart } from 'lucide-react';
import { useStore } from '../store';
import type { Team } from '../types';
import { csv, download, fmtDate, isOverdue, loggedHours, statusMeta } from '../components/ui';

export function Analytics() {
  const { tasks, me, isAdmin } = useStore();
  const scope = tasks.filter((t) => isAdmin || t.team === me.team);
  const real = scope.filter((t) => !t.incoming);
  const done = real.filter((t) => t.status === 'done');
  const rate = real.length ? Math.round((done.length / real.length) * 100) : 0;
  const avg = done.length ? done.reduce((a, t) => a + (t.completedAt ? (new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime()) / 36e5 : 0), 0) / done.length : 0;
  const max = Math.max(1, ...statusMeta.map((s) => real.filter((t) => t.status === s.key).length));
  const teams: Team[] = ['Development', 'Marketing', 'Creative'];

  return (
    <>
      <h1 className="page-title row"><BarChart3 /> Analytics</h1>
      <p className="page-sub">Deliverables performance for {isAdmin ? 'the whole workspace' : `the ${me.team} team`}.</p>
      <div className="grid g5" style={{ marginBottom: 16 }}>
        <div className="card stat"><b>{real.length}</b><span>Total tasks</span></div>
        <div className="card stat"><b>{rate}%</b><span>Completion rate</span></div>
        <div className="card stat"><b style={{ color: 'var(--red)' }}>{real.filter(isOverdue).length}</b><span>Overdue</span></div>
        <div className="card stat"><b>{scope.filter((t) => t.incoming).length}</b><span>In incoming queue</span></div>
        <div className="card stat"><b>{avg.toFixed(1)}h</b><span>Avg completion time</span></div>
      </div>
      <div className="grid g2">
        <div className="card"><h3>Tasks by status</h3>
          {statusMeta.map((s) => { const n = real.filter((t) => t.status === s.key).length; return <div className="hbar" key={s.key}><span>{s.label}</span><div className="bar"><i style={{ width: `${(n / max) * 100}%`, background: s.color }} /></div><b>{n}</b></div>; })}
        </div>
        <div className="card"><h3>Estimated vs logged hours by team</h3>
          {teams.filter((t) => isAdmin || t === me.team).map((tm) => {
            const ts = real.filter((t) => t.team === tm); const est = ts.reduce((a, t) => a + t.estHours, 0); const lg = ts.reduce((a, t) => a + loggedHours(t), 0);
            return <div key={tm} style={{ margin: '14px 0' }}><div className="row"><b className="grow">{tm}</b><span className="muted mono">{lg.toFixed(1)}h / {est}h</span></div><div className="bar" style={{ marginTop: 6 }}><i style={{ width: `${est ? Math.min(100, (lg / est) * 100) : 0}%` }} /></div></div>;
          })}
        </div>
      </div>
    </>
  );
}

export function Reports() {
  const { tasks, user, client, me, isAdmin } = useStore();
  const scope = tasks.filter((t) => isAdmin || t.team === me.team);
  const exportTasks = () => download(`tasks-${new Date().toISOString().slice(0, 10)}.csv`, csv([
    ['ID', 'Title', 'Client', 'Team', 'Status', 'Priority', 'Assignee', 'Due', 'Est h', 'Logged h'],
    ...scope.map((t) => [t.id, t.title, client(t.clientId)?.name ?? '', t.team, t.status, t.priority, user(t.assigneeId)?.name ?? '', t.due ?? '', t.estHours, loggedHours(t)]),
  ]));
  return (
    <>
      <h1 className="page-title row"><FileBarChart /> Reports</h1>
      <p className="page-sub">Export data for client reports and payroll.</p>
      <div className="grid g2">
        <div className="card col"><h3>Task report</h3><p className="muted" style={{ margin: 0 }}>{scope.length} tasks with client, status, assignee and hours.</p><button className="btn primary" onClick={exportTasks}><Download size={15} /> Download CSV</button></div>
        <div className="card col"><h3>Overdue digest</h3>{scope.filter(isOverdue).length === 0 ? <span className="muted">Nothing overdue.</span> : scope.filter(isOverdue).map((t) => <div key={t.id} className="subtask"><b className="grow">{t.title}</b><span className="muted">{fmtDate(t.due)}</span></div>)}</div>
      </div>
    </>
  );
}
