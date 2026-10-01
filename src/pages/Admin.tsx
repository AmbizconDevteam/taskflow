import { ShieldCheck, Trash2, Users, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store';
import { Avatar, Modal, fmtMoney } from '../components/ui';

const roleName = { super_admin: 'Super Admin', team_lead: 'Team Lead', member: 'Team Member', reception: 'Reception' } as const;

export function Directory() {
  const { users, me, deleteUser, toast, tasks } = useStore();
  const [del, setDel] = useState<string | null>(null);
  const target = users.find((u) => u.id === del);
  return (
    <>
      <h1 className="page-title row"><Users /> User Directory</h1>
      <p className="page-sub">{users.length} people across {new Set(users.map((u) => u.branch)).size} branches.</p>
      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Role</th><th>Team</th><th>Branch</th><th>Open tasks</th><th /></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><div className="row"><Avatar user={u} /><div><b>{u.name}</b><div className="muted" style={{ fontSize: 12 }}>{u.email}</div></div></div></td>
                <td><span className={`chip ${u.role === 'super_admin' ? 'purple' : u.role === 'team_lead' ? 'client' : ''}`}>{roleName[u.role]}</span></td>
                <td>{u.team ?? '—'}</td><td>{u.branch}</td><td>{tasks.filter((t) => t.assigneeId === u.id && t.status !== 'done').length}</td>
                <td>{u.id !== me.id && <button className="btn sm soft-danger" onClick={() => setDel(u.id)}><Trash2 size={14} /></button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {target && (
        <Modal size="sm" title="Remove workspace member?" onClose={() => setDel(null)}
          footer={<><button className="btn" onClick={() => setDel(null)}>Cancel</button><button className="btn danger" onClick={() => { deleteUser(target.id); toast(`${target.name} removed`); setDel(null); }}>Remove user</button></>}>
          <p style={{ margin: 0 }}><b>{target.name}</b> will lose access. Their open tasks become unassigned.</p>
        </Modal>
      )}
    </>
  );
}

export function Approvals() {
  const { roleRequests, clients, user, decideRole, patchClient, toast } = useStore();
  const pendingClients = clients.filter((c) => !c.approved);
  const pendingRoles = roleRequests.filter((r) => r.status === 'pending');
  return (
    <>
      <h1 className="page-title row"><ShieldCheck /> Role Approvals</h1>
      <p className="page-sub">Requests that need a Super Admin decision.</p>
      <div className="grid g2">
        <div className="card col">
          <h3>Role change requests <span className="count-pill">{pendingRoles.length}</span></h3>
          {pendingRoles.length === 0 && <div className="empty">All caught up.</div>}
          {pendingRoles.map((r) => (
            <div key={r.id} className="cmt col" style={{ gap: 8 }}>
              <div className="row"><Avatar user={user(r.userId)} /><b>{user(r.userId)?.name}</b><span className="chip right">{roleName[r.from]} → {roleName[r.to]}</span></div>
              <span className="muted">{r.reason}</span>
              <div className="row"><button className="btn sm good" onClick={() => { decideRole(r.id, true); toast('Role updated'); }}>Approve</button><button className="btn sm soft-danger" onClick={() => decideRole(r.id, false)}>Reject</button></div>
            </div>
          ))}
        </div>
        <div className="card col">
          <h3>New clients from Team Leads <span className="count-pill">{pendingClients.length}</span></h3>
          {pendingClients.length === 0 && <div className="empty">No clients waiting.</div>}
          {pendingClients.map((c) => (
            <div key={c.id} className="cmt col" style={{ gap: 8 }}>
              <div className="row"><b className="grow">{c.name}</b><span className="muted">added by {user(c.addedBy)?.name}</span></div>
              <div className="row"><button className="btn sm good" onClick={() => { patchClient(c.id, { approved: true }); toast(`${c.name} approved`); }}>Approve client</button></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function Finance() {
  const { clients, claims, tasks } = useStore();
  const rows = clients.filter((c) => c.approved).map((c) => ({ c, fee: c.services.reduce((a, s) => a + s.monthlyFee, 0), hrs: c.services.reduce((a, s) => a + s.monthlyHours, 0), used: tasks.filter((t) => t.clientId === c.id).reduce((a, t) => a + t.timeEntries.reduce((x, e) => x + e.hours, 0), 0) }));
  const mrr = rows.reduce((a, r) => a + r.fee, 0);
  const pendingClaims = claims.filter((c) => ['submitted', 'tl_approved', 'ceo_approved', 'admin_approved'].includes(c.state)).reduce((a, c) => a + c.amount, 0);
  return (
    <>
      <h1 className="page-title row"><Wallet /> Company Finance</h1>
      <p className="page-sub">Retainer revenue against hours delivered. Fees are illustrative demo values.</p>
      <div className="grid g3" style={{ marginBottom: 16 }}>
        <div className="card stat"><b className="mono">{fmtMoney(mrr)}</b><span>Monthly retainer revenue</span></div>
        <div className="card stat"><b className="mono">{rows.reduce((a, r) => a + r.hrs, 0)}h</b><span>Contracted hours / month</span></div>
        <div className="card stat"><b className="mono">{fmtMoney(pendingClaims)}</b><span>Claims awaiting payment</span></div>
      </div>
      <div className="card">
        <table><thead><tr><th>Client</th><th>Retainer</th><th>Contracted</th><th>Logged</th><th>Effective rate</th></tr></thead>
          <tbody>{rows.map(({ c, fee, hrs, used }) => (
            <tr key={c.id}><td><b>{c.name}</b></td><td className="mono">{fmtMoney(fee)}</td><td>{hrs}h</td><td>{used.toFixed(1)}h</td><td className="mono">{used > 0 ? fmtMoney(Math.round(fee / used)) + '/h' : '—'}</td></tr>
          ))}</tbody></table>
      </div>
    </>
  );
}
