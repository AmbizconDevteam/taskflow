import { Plus, Receipt } from 'lucide-react';
import { useRef, useState } from 'react';
import { useStore } from '../store';
import { day, uid } from '../data/seed';
import type { Claim } from '../types';
import { Field, Modal, fmtDate, fmtMoney, validateFile } from '../components/ui';

const flow: Claim['state'][] = ['submitted', 'tl_approved', 'ceo_approved', 'admin_approved', 'paid'];
const label: Record<Claim['state'], string> = { draft: 'Draft', submitted: 'Submitted', tl_approved: 'TL approved', ceo_approved: 'CEO approved', admin_approved: 'Admin approved', paid: 'Paid', rejected: 'Rejected' };
const chip = (s: Claim['state']) => (s === 'paid' || s === 'admin_approved' ? 'green' : s === 'rejected' ? 'red' : s === 'draft' ? '' : 'approval');

export default function Reimbursements() {
  const { claims, me, user, isLead, isAdmin, addClaim, patchClaim, toast } = useStore();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: '', category: 'Travel' as Claim['category'], amount: '', date: day(0) });
  const [receipt, setReceipt] = useState<string>();
  const ref = useRef<HTMLInputElement>(null);
  const list = claims.filter((c) => isAdmin || c.userId === me.id || (isLead && user(c.userId)?.team === me.team));

  const save = (state: Claim['state']) => {
    const amount = parseFloat(f.amount);
    if (!f.title.trim() || !(amount > 0)) return toast('Add a title and an amount above 0', 'err');
    if (state === 'submitted' && !receipt) return toast('Attach a receipt before submitting', 'err');
    addClaim({ id: uid('r'), userId: me.id, title: f.title.trim(), category: f.category, amount, date: f.date, receipt, state });
    setOpen(false); setF({ title: '', category: 'Travel', amount: '', date: day(0) }); setReceipt(undefined);
    toast(state === 'draft' ? 'Draft saved' : 'Claim submitted for sign-off');
  };

  // Each role can only advance the step it owns: TL -> CEO(admin) -> Admin -> Paid.
  const next = (c: Claim): { to: Claim['state']; text: string } | null => {
    const owner = user(c.userId);
    if (c.state === 'submitted' && (isAdmin || (me.role === 'team_lead' && owner?.team === me.team && c.userId !== me.id))) return { to: 'tl_approved', text: 'Approve (TL)' };
    if (c.state === 'tl_approved' && isAdmin) return { to: 'ceo_approved', text: 'Approve (CEO)' };
    if (c.state === 'ceo_approved' && isAdmin) return { to: 'admin_approved', text: 'Approve (Admin)' };
    if (c.state === 'admin_approved' && isAdmin) return { to: 'paid', text: 'Mark paid' };
    return null;
  };

  return (
    <>
      <div className="row"><h1 className="page-title grow row"><Receipt /> Reimbursements <span className="chip purple">Ambizcon Claim</span></h1>
        <button className="btn primary" onClick={() => setOpen(true)}><Plus size={16} /> New claim</button></div>
      <p className="page-sub">Submit expenses with receipts. Sign-off runs Team Lead → CEO → Admin → Paid.</p>
      <div className="card">
        <table>
          <thead><tr><th>Claim</th><th>By</th><th>Date</th><th>Amount</th><th>Progress</th><th>Status</th><th /></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={7} className="muted">No claims.</td></tr>}
            {list.map((c) => {
              const step = flow.indexOf(c.state);
              const n = next(c);
              return (
                <tr key={c.id}>
                  <td><b>{c.title}</b><div className="muted" style={{ fontSize: 12 }}>{c.category}{c.receipt ? ` · ${c.receipt}` : ''}</div></td>
                  <td>{user(c.userId)?.name}</td><td>{fmtDate(c.date)}</td><td className="mono">{fmtMoney(c.amount)}</td>
                  <td style={{ width: 150 }}><div className="bar"><i style={{ width: `${step < 0 ? 0 : ((step + 1) / flow.length) * 100}%` }} /></div></td>
                  <td><span className={`chip ${chip(c.state)}`}>{label[c.state]}</span></td>
                  <td className="row">
                    {c.state === 'draft' && c.userId === me.id && <button className="btn sm" onClick={() => patchClaim(c.id, { state: 'submitted' })}>Submit</button>}
                    {n && <button className="btn sm good" onClick={() => patchClaim(c.id, { state: n.to })}>{n.text}</button>}
                    {n && c.state !== 'draft' && <button className="btn sm soft-danger" onClick={() => patchClaim(c.id, { state: 'rejected' })}>Reject</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {open && (
        <Modal size="sm" title="New reimbursement claim" onClose={() => setOpen(false)}
          footer={<><button className="btn" onClick={() => save('draft')}>Save draft</button><button className="btn primary" onClick={() => save('submitted')}>Submit</button></>}>
          <div className="col">
            <Field label="Title"><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
            <div className="grid g2">
              <Field label="Category"><select className="select" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Claim['category'] })}>{['Travel', 'Meals', 'Software', 'Equipment', 'Client Visit', 'Other'].map((c) => <option key={c}>{c}</option>)}</select></Field>
              <Field label="Amount (₹)"><input className="input" type="number" min="0" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
            </div>
            <Field label="Date"><input className="input" type="date" max={day(0)} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
            <Field label="Receipt (max 5MB)">
              <button className="btn" onClick={() => ref.current?.click()}>{receipt ?? 'Upload receipt'}</button>
              <input ref={ref} hidden type="file" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const err = validateFile(file); if (err) return toast(err, 'err'); setReceipt(file.name); }} />
            </Field>
          </div>
        </Modal>
      )}
    </>
  );
}
