import { Building2, ExternalLink, KeyRound, Server } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store';
import { fmtMoney, loggedHours } from '../components/ui';

export default function Clients() {
  const { clients, tasks, isAdmin } = useStore();
  const list = clients.filter((c) => c.approved);
  const [sel, setSel] = useState(list[0]?.id);
  const c = list.find((x) => x.id === sel) ?? list[0];
  const month = new Date().toISOString().slice(0, 7);
  const used = (id: string) => tasks.filter((t) => t.clientId === id).flatMap((t) => t.timeEntries).filter((e) => e.at.startsWith(month)).reduce((a, e) => a + e.hours, 0) ||
    tasks.filter((t) => t.clientId === id).reduce((a, t) => a + loggedHours(t), 0);

  return (
    <>
      <h1 className="page-title row"><Building2 /> Clients &amp; Site Vault</h1>
      <p className="page-sub">WordPress sites, hosting and retainers. Credentials are vault pointers — raw passwords never live here.</p>
      <div className="grid" style={{ gridTemplateColumns: '280px 1fr' }}>
        <div className="card col" style={{ gap: 4, padding: 10, alignSelf: 'start' }}>
          {list.map((x) => <button key={x.id} className={`btn ${x.id === c?.id ? 'primary' : 'ghost'}`} style={{ justifyContent: 'flex-start', border: 0 }} onClick={() => setSel(x.id)}>{x.name}</button>)}
        </div>
        {c && (
          <div className="col" style={{ gap: 16 }}>
            <div className="card">
              <h3 style={{ marginBottom: 10 }}>Services &amp; retainers</h3>
              {c.services.length === 0 && <span className="muted">No active services.</span>}
              {c.services.map((s) => {
                const u = used(c.id);
                const pct = Math.min(100, (u / s.monthlyHours) * 100);
                return (
                  <div key={s.name} style={{ marginBottom: 14 }}>
                    <div className="row"><b className="grow">{s.name}</b>{isAdmin && <span className="mono">{fmtMoney(s.monthlyFee)}/mo</span>}<span className="muted">{s.monthlyHours}h / month</span></div>
                    <div className="bar" style={{ margin: '6px 0 2px' }}><i style={{ width: `${pct}%` }} /></div>
                    <small className="muted">{used(c.id).toFixed(1)}h logged against this client</small>
                  </div>
                );
              })}
            </div>
            <div className="card">
              <h3 className="row" style={{ marginBottom: 10 }}><Server size={18} /> WordPress sites</h3>
              {c.sites.length === 0 && <span className="muted">No sites on file.</span>}
              {c.sites.map((s) => (
                <div key={s.id} className="card" style={{ boxShadow: 'none', marginBottom: 10, background: 'var(--surface-2)' }}>
                  <div className="row"><b className="grow">{s.label}</b><span className="chip client">{s.host}</span></div>
                  <div className="col" style={{ gap: 4, marginTop: 8, fontSize: 13 }}>
                    <a href={s.liveUrl} target="_blank" rel="noreferrer"><ExternalLink size={12} /> Live: {s.liveUrl}</a>
                    {s.stagingUrl && <a href={s.stagingUrl} target="_blank" rel="noreferrer"><ExternalLink size={12} /> Staging: {s.stagingUrl}</a>}
                    <span className="muted"><KeyRound size={12} /> Credentials: <b style={{ color: 'var(--text)' }}>{s.credentialsRef}</b></span>
                    {s.notes && <span className="muted">{s.notes}</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="card"><h3 style={{ marginBottom: 8 }}>Projects</h3>{c.projects.map((p) => <div key={p.id} className="subtask">{p.name}<span className="chip right">{tasks.filter((t) => t.projectId === p.id).length} tasks</span></div>)}</div>
          </div>
        )}
      </div>
    </>
  );
}
