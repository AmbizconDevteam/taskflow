import { CheckCircle2, MessageSquareWarning } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../store';
import { Field, fmtDate } from '../components/ui';

// Public, login-free page for clients, reached through the task's tokenised share link.
export default function Share() {
  const { token } = useParams();
  const { tasks, client, patchTask, user } = useStore();
  const t = tasks.find((x) => x.approvalToken === token);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  if (!t) return <div className="share"><div className="card"><h2>Link not found</h2><p className="muted">This approval link is invalid or the task was removed.</p></div></div>;
  const c = client(t.clientId);
  const visible = t.comments.filter((x) => !x.internal);

  const decide = (decision: 'approved' | 'changes') => {
    if (!name.trim()) return alert('Please enter your name so we know who responded.');
    if (decision === 'changes' && !note.trim()) return alert('Tell us what to change.');
    patchTask(t.id, { clientDecision: { decision, note: note.trim(), name: name.trim(), at: new Date().toISOString() } }, decision === 'approved' ? `Client (${name.trim()}) approved the deliverable` : `Client (${name.trim()}) requested changes: ${note.trim()}`);
  };

  return (
    <div className="share col" style={{ gap: 18 }}>
      <div className="row"><div className="brand-mark">B</div><div><b style={{ fontSize: 18 }}>Ambizcon</b><div className="muted">Deliverable review for {c?.name}</div></div></div>
      <div className="card col">
        <h1 style={{ fontSize: 24 }}>{t.title}</h1>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{t.description}</p>
        <div className="muted">Prepared by {user(t.assigneeId)?.name ?? 'the Ambizcon team'} · due {fmtDate(t.due)}</div>
        {t.attachments.length > 0 && <div className="thumbs">{t.attachments.map((a) => <div key={a.id} className="thumb" style={{ width: 200, height: 150 }}>{a.dataUrl ? <img src={a.dataUrl} alt={a.name} /> : a.name}</div>)}</div>}
        {visible.length > 0 && <div className="col" style={{ gap: 8 }}>{visible.map((m) => <div key={m.id} className="cmt"><b>{user(m.userId)?.name}</b><p style={{ margin: '6px 0 0' }}>{m.body}</p></div>)}</div>}
      </div>
      {t.clientDecision ? (
        <div className="card col" style={{ borderColor: t.clientDecision.decision === 'approved' ? 'var(--green)' : 'var(--red)' }}>
          <b className="row">{t.clientDecision.decision === 'approved' ? <CheckCircle2 color="var(--green)" /> : <MessageSquareWarning color="var(--red)" />} {t.clientDecision.decision === 'approved' ? 'Approved — thank you!' : 'Changes requested'}</b>
          <span className="muted">Response from {t.clientDecision.name} on {fmtDate(t.clientDecision.at)}.</span>{t.clientDecision.note && <p style={{ margin: 0 }}>“{t.clientDecision.note}”</p>}
        </div>
      ) : (
        <div className="card col">
          <h3>Your sign-off</h3>
          <Field label="Your name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Comments (required if requesting changes)"><textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <div className="row"><button className="btn good" onClick={() => decide('approved')}><CheckCircle2 size={16} /> Approve</button><button className="btn soft-danger" onClick={() => decide('changes')}>Request changes</button></div>
        </div>
      )}
    </div>
  );
}
