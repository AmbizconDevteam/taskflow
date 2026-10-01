import { AlertTriangle, CheckCircle2, Clock, Copy, Image as ImageIcon, Link2, Paperclip, Plus, RefreshCw, Send, ShieldCheck, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { uid } from '../data/seed';
import type { Status } from '../types';
import { Avatar, Field, Modal, PriorityChip, fmtDate, fmtTime, isOverdue, loggedHours, readDataUrl, statusMeta, subProgress, validateFile } from '../components/ui';

export function TaskModal({ id, onClose, startReview }: { id: string; onClose: () => void; startReview?: boolean }) {
  const { tasks, me, users, isLead, isAdmin, user, client, patchTask, moveTask, deleteTask, canSignOff, toast } = useStore();
  const t = tasks.find((x) => x.id === id);
  const [reviewer, setReviewer] = useState(t?.reviewerId ?? '');
  const [askReview, setAskReview] = useState(!!startReview);
  const [changes, setChanges] = useState(false);
  const [note, setNote] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const [comment, setComment] = useState('');
  const [internal, setInternal] = useState(true);
  const [hours, setHours] = useState('');
  const [hnote, setHnote] = useState('');
  const [sub, setSub] = useState('');
  const file = useRef<HTMLInputElement>(null);

  if (!t) return null;
  const c = client(t.clientId);
  const project = c?.projects.find((p) => p.id === t.projectId);
  const sp = subProgress(t);
  const logged = loggedHours(t);
  const isReviewer = t.reviewerId === me.id || isAdmin;
  const isWorker = t.assigneeId === me.id || canSignOff(t);
  const shareUrl = `${window.location.origin}/share/${t.approvalToken}`;
  const canDelete = isLead || t.createdBy === me.id;
  const reviewerChoices = users.filter((u) => u.id !== me.id && u.role !== 'reception');

  const submitReview = () => {
    if (!reviewer) return toast('Choose a reviewer first', 'err');
    patchTask(t.id, { status: 'review', reviewerId: reviewer, revision: undefined }, `Submitted for review to ${user(reviewer)?.name}`);
    setAskReview(false);
    toast(`Sent to ${user(reviewer)?.name} for review`);
  };
  const requestChanges = () => {
    if (!note.trim()) return toast('Add feedback so the assignee knows what to fix', 'err');
    patchTask(t.id, { status: 'in_progress', revision: { note: note.trim(), by: me.id, at: new Date().toISOString() } }, `Requested changes: ${note.trim()}`);
    setChanges(false); setNote('');
    toast('Sent back to In Progress with your feedback');
  };
  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      const err = validateFile(f);
      if (err) { toast(err, 'err'); continue; }
      const dataUrl = await readDataUrl(f);
      patchTask(t.id, (cur) => ({ attachments: [...cur.attachments, { id: uid('a'), name: f.name, size: f.size, type: f.type, dataUrl }] }), `Attached ${f.name}`);
    }
    if (file.current) file.current.value = '';
  };

  return (
    <>
      <Modal size="wide" onClose={onClose}
        title={<div className="col" style={{ gap: 6 }}>
          <div className="row wrap"><span className="mono muted" style={{ fontSize: 12 }}>{t.id}</span><PriorityChip p={t.priority} />{c && <span className="chip client">{c.name}</span>}
            {t.creationApproval === 'pending' && <span className="chip approval">PENDING APPROVAL</span>}{t.recurring && <span className="chip purple"><RefreshCw size={11} />{t.recurring}</span>}</div>
          <span>{t.title}</span></div>}>
        <div className="col" style={{ gap: 16 }}>
          {t.revision && t.status === 'in_progress' && (
            <div className="banner-rev">
              <b className="row"><AlertTriangle size={16} /> Revisions requested by {user(t.revision.by)?.name}</b>
              <p>{t.revision.note}</p>
              {isWorker && <button className="btn danger sm" onClick={() => { setReviewer(t.reviewerId ?? ''); setAskReview(true); }}><Send size={14} /> Re-Submit for Review</button>}
            </div>
          )}
          {t.creationApproval === 'pending' && (
            <div className="banner-warn row">
              <ShieldCheck size={18} /><span className="grow">Created by {user(t.createdBy)?.name}. A {t.team} Team Lead or Super Admin must sign off before work starts.</span>
              {canSignOff(t) && <button className="btn good sm" onClick={() => { patchTask(t.id, { creationApproval: 'approved' }, 'Signed off task creation'); toast('Task approved'); }}>Sign off</button>}
            </div>
          )}
        </div>

        <div className="split" style={{ marginTop: 18 }}>
          <div className="col" style={{ gap: 22 }}>
            <div><h3 className="sec-title">Description</h3><p style={{ margin: 0, lineHeight: 1.55 }}>{t.description || 'No description.'}</p></div>

            <div>
              <h3 className="sec-title">Subtasks {sp.total > 0 && `· ${sp.done}/${sp.total}`}</h3>
              {sp.total > 0 && <div className="bar" style={{ marginBottom: 6 }}><i style={{ width: `${(sp.done / sp.total) * 100}%` }} /></div>}
              {t.subtasks.map((s) => (
                <label key={s.id} className={`subtask ${s.done ? 'done' : ''}`}>
                  <input type="checkbox" checked={s.done} onChange={() => patchTask(t.id, (cur) => ({ subtasks: cur.subtasks.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)) }), `${s.done ? 'Reopened' : 'Completed'} subtask “${s.title}”`)} />
                  <span>{s.title}</span>
                </label>
              ))}
              <form className="row" style={{ marginTop: 10 }} onSubmit={(e) => { e.preventDefault(); if (!sub.trim()) return; patchTask(t.id, (cur) => ({ subtasks: [...cur.subtasks, { id: uid('st'), title: sub.trim(), done: false }] })); setSub(''); }}>
                <input className="input" placeholder="Add a subtask…" value={sub} onChange={(e) => setSub(e.target.value)} />
                <button className="btn sm" type="submit"><Plus size={14} /></button>
              </form>
            </div>

            <div>
              <h3 className="sec-title row">Attachments <button className="btn sm right" onClick={() => file.current?.click()}><Paperclip size={14} /> Upload</button></h3>
              <input ref={file} type="file" multiple hidden onChange={(e) => addFiles(e.target.files)} />
              <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>PDF, PNG, JPG, DOC, ZIP, XLSX, TXT — max 5MB each</div>
              <div className="thumbs">
                {t.attachments.length === 0 && <span className="muted">No files yet.</span>}
                {t.attachments.map((a) => (
                  <div key={a.id} className="thumb" title={a.name}>
                    {a.dataUrl ? <img src={a.dataUrl} alt={a.name} /> : a.type.startsWith('image/') ? <span><ImageIcon size={18} /><br />{a.name}</span> : <span>{a.name}</span>}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="sec-title">Discussion</h3>
              <div className="col" style={{ gap: 8 }}>
                {t.comments.map((cm) => (
                  <div key={cm.id} className={`cmt ${cm.internal ? 'internal' : ''}`}>
                    <div className="row"><Avatar user={user(cm.userId)} /><b>{user(cm.userId)?.name}</b><span className="muted">{fmtDate(cm.at)} {fmtTime(cm.at)}</span>
                      {cm.internal ? <span className="chip approval right">Internal</span> : <span className="chip green right">Client-visible</span>}</div>
                    <p style={{ margin: '8px 0 0' }}>{cm.body}</p>
                  </div>
                ))}
                <textarea className="textarea" placeholder="Write a comment…" value={comment} onChange={(e) => setComment(e.target.value)} />
                <div className="row">
                  <label className="row muted"><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /> Internal team note</label>
                  <button className="btn sm primary right" onClick={() => { if (!comment.trim()) return; patchTask(t.id, (cur) => ({ comments: [...cur.comments, { id: uid('c'), userId: me.id, body: comment.trim(), internal, at: new Date().toISOString() }] })); setComment(''); }}>Post</button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="sec-title">Audit history</h3>
              <div className="timeline">
                {[...t.history].reverse().map((h) => (<div key={h.id}><b>{user(h.userId)?.name}</b> {h.text}<br /><span className="muted" style={{ fontSize: 12 }}>{fmtDate(h.at)} · {fmtTime(h.at)}</span></div>))}
              </div>
            </div>
          </div>

          <div className="col" style={{ gap: 16 }}>
            <div className="card col" style={{ gap: 12, padding: 16 }}>
              <Field label="Status">
                <select className="select" value={t.status} onChange={(e) => { const to = e.target.value as Status; if (to === 'review' && !t.reviewerId) { setAskReview(true); return; } moveTask(t.id, to); }}>
                  {statusMeta.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="Assignee">
                <div className="row"><Avatar user={user(t.assigneeId)} />
                  <select className="select" disabled={!isLead} value={t.assigneeId ?? ''} onChange={(e) => patchTask(t.id, { assigneeId: e.target.value || undefined }, `Assigned to ${user(e.target.value)?.name ?? 'nobody'}`)}>
                    <option value="">Unassigned</option>{users.filter((u) => u.role !== 'reception').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select></div>
              </Field>
              <div className="row wrap muted" style={{ fontSize: 13, gap: 18 }}>
                <span>Team: <b style={{ color: 'var(--text)' }}>{t.team}</b></span>
                <span>Due: <b style={{ color: isOverdue(t) ? 'var(--red)' : 'var(--text)' }}>{fmtDate(t.due)}</b></span>
                {project && <span>Project: <b style={{ color: 'var(--text)' }}>{project.name}</b></span>}
                <span>Created by: <b style={{ color: 'var(--text)' }}>{user(t.createdBy)?.name}</b></span>
                {t.reviewerId && <span>Reviewer: <b style={{ color: 'var(--text)' }}>{user(t.reviewerId)?.name}</b></span>}
              </div>
            </div>

            {(t.status === 'in_progress' || t.status === 'todo' || t.status === 'support') && isWorker && t.creationApproval === 'approved' && !askReview && !t.revision && (
              <button className="btn primary" onClick={() => setAskReview(true)}><Send size={16} /> Submit for Review</button>
            )}
            {askReview && (
              <div className="card col" style={{ gap: 10, padding: 16, borderColor: 'var(--primary)' }}>
                <Field label="Pick any reviewer in the workspace">
                  <select className="select" value={reviewer} onChange={(e) => setReviewer(e.target.value)}>
                    <option value="">Choose reviewer…</option>{reviewerChoices.map((u) => <option key={u.id} value={u.id}>{u.name}{u.team ? ` · ${u.team}` : ''}</option>)}
                  </select>
                </Field>
                <div className="row"><button className="btn primary sm" onClick={submitReview}>Send for review</button><button className="btn sm" onClick={() => setAskReview(false)}>Cancel</button></div>
              </div>
            )}
            {t.status === 'review' && isReviewer && (
              <div className="card col" style={{ gap: 10, padding: 16 }}>
                <b>Review deliverable</b>
                <button className="btn good" onClick={() => { moveTask(t.id, 'done'); toast('Approved & completed'); onClose(); }}><CheckCircle2 size={16} /> Approve &amp; Complete</button>
                <button className="btn soft-danger" onClick={() => setChanges(true)}>Request Changes</button>
              </div>
            )}

            <div className="card" style={{ padding: 16 }}>
              <h3 className="sec-title row"><Clock size={14} /> Time logger</h3>
              <div className="row muted" style={{ fontSize: 13 }}><b style={{ color: 'var(--text)' }}>{logged.toFixed(1)}h</b> logged of {t.estHours}h est.</div>
              <div className="bar" style={{ margin: '8px 0 12px' }}><i style={{ width: `${Math.min(100, (logged / Math.max(t.estHours, 0.1)) * 100)}%`, background: logged > t.estHours ? 'var(--red)' : undefined }} /></div>
              <form className="row" onSubmit={(e) => { e.preventDefault(); const h = parseFloat(hours); if (!(h > 0)) return toast('Enter hours greater than 0', 'err'); patchTask(t.id, (cur) => ({ timeEntries: [...cur.timeEntries, { id: uid('te'), userId: me.id, hours: h, note: hnote, at: new Date().toISOString() }] }), `Logged ${h}h${hnote ? ` — ${hnote}` : ''}`); setHours(''); setHnote(''); }}>
                <input className="input" style={{ width: 80 }} type="number" step="0.25" min="0" placeholder="hrs" value={hours} onChange={(e) => setHours(e.target.value)} />
                <input className="input" placeholder="What did you do?" value={hnote} onChange={(e) => setHnote(e.target.value)} />
                <button className="btn sm primary" type="submit">Log</button>
              </form>
            </div>

            <div className="card col" style={{ padding: 16, gap: 8 }}>
              <h3 className="sec-title row"><Link2 size={14} /> Client share link</h3>
              <input className="input mono" style={{ fontSize: 11.5 }} readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} />
              <div className="row">
                <button className="btn sm" onClick={() => { navigator.clipboard?.writeText(shareUrl); toast('Link copied'); }}><Copy size={14} /> Copy</button>
                <Link className="btn sm" to={`/share/${t.approvalToken}`} onClick={onClose}>Preview</Link>
              </div>
              {t.clientDecision && <div className={`chip ${t.clientDecision.decision === 'approved' ? 'green' : 'red'}`}>Client {t.clientDecision.decision === 'approved' ? 'approved' : 'asked for changes'} · {t.clientDecision.name}</div>}
              {t.clientDecision?.note && <div className="muted" style={{ fontSize: 13 }}>“{t.clientDecision.note}”</div>}
            </div>

            {canDelete && <button className="btn soft-danger" onClick={() => setConfirmDel(true)}><Trash2 size={16} /> Delete task</button>}
          </div>
        </div>
      </Modal>

      {changes && (
        <Modal size="sm" title="Request changes" onClose={() => setChanges(false)}
          footer={<><button className="btn" onClick={() => setChanges(false)}>Cancel</button><button className="btn danger" onClick={requestChanges}>Send Revisions &amp; Revert</button></>}>
          <Field label="Feedback for the assignee"><textarea className="textarea" autoFocus placeholder="What needs to change?" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        </Modal>
      )}
      {confirmDel && (
        <Modal size="sm" title="Delete this task?" onClose={() => setConfirmDel(false)}
          footer={<><button className="btn" onClick={() => setConfirmDel(false)}>Cancel</button><button className="btn danger" onClick={() => { deleteTask(t.id); toast('Task deleted'); onClose(); }}>Delete Task Permanently</button></>}>
          <p style={{ margin: 0 }}>“{t.title}” and its history, comments and attachments will be removed. This cannot be undone.</p>
        </Modal>
      )}
    </>
  );
}
