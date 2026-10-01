import { Paperclip, RefreshCw, Sparkles } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { iso, templates, token, uid, day } from '../data/seed';
import type { Attachment, Frequency, Priority, Task, Team } from '../types';
import { Field, Modal, readDataUrl, validateFile } from '../components/ui';

export function CreateTaskModal({ onClose }: { onClose: () => void }) {
  const { me, users, clients, isLead, isAdmin, addTask, addClient, toast, tasks } = useStore();
  const [tpl, setTpl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [clientId, setClientId] = useState('');
  const [newClient, setNewClient] = useState('');
  const [projectId, setProjectId] = useState('');
  const [team, setTeam] = useState<Team>(me.team ?? 'Development');
  const [cross, setCross] = useState(false);
  const [targetTeam, setTargetTeam] = useState<Team>('Creative');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assignee, setAssignee] = useState('');
  const [due, setDue] = useState('');
  const [est, setEst] = useState(4);
  const [labels, setLabels] = useState('');
  const [recurring, setRecurring] = useState<'' | Frequency>('');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [files, setFiles] = useState<Attachment[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const approvedClients = clients.filter((c) => c.approved || c.addedBy === me.id);
  const client = clients.find((c) => c.id === clientId);
  const effectiveTeam = cross ? targetTeam : team;
  const people = useMemo(() => users.filter((u) => u.role !== 'reception' && (u.team === effectiveTeam || u.role === 'super_admin')), [users, effectiveTeam]);

  const applyTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setTpl(id); setTitle((v) => v || t.name); setTeam(t.team); setEst(t.estHours); setPriority(t.priority);
    setLabels(t.labels.join(', ')); setRecurring(t.recurring ?? ''); setSubtasks(t.subtasks);
  };

  const addFiles = async (list: FileList | null) => {
    if (!list) return;
    const ok: Attachment[] = [];
    for (const f of Array.from(list)) {
      const err = validateFile(f);
      if (err) { toast(err, 'err'); continue; }
      ok.push({ id: uid('a'), name: f.name, size: f.size, type: f.type, dataUrl: await readDataUrl(f) });
    }
    setFiles((p) => [...p, ...ok]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = () => {
    if (!title.trim()) return toast('Give the task a title', 'err');
    let cid = clientId;
    if (clientId === '__new') {
      if (!newClient.trim()) return toast('Enter the new client name', 'err');
      cid = addClient(newClient.trim());
    }
    if (!cid) return toast('Pick a client', 'err');
    const n = Math.max(100, ...tasks.map((t) => parseInt(t.id.slice(2), 10) || 0)) + 1;
    const needsSignoff = !isLead; // members' tasks wait for Team Lead / Super Admin
    const task: Task = {
      id: `T-${n}`, title: title.trim(), description: desc.trim(), status: cross ? 'backlog' : assignee ? 'todo' : 'backlog',
      priority, team: effectiveTeam, clientId: cid, projectId: projectId || undefined, assigneeId: cross ? undefined : assignee || undefined,
      createdBy: me.id, labels: labels.split(',').map((l) => l.trim()).filter(Boolean), due: due || undefined, estHours: est,
      timeEntries: [], subtasks: subtasks.map((s) => ({ id: uid('st'), title: s, done: false })), attachments: files, comments: [],
      history: [{ id: uid('h'), userId: me.id, text: cross ? `Created cross-team request for ${effectiveTeam}` : 'Created this task', at: iso(0, new Date().getHours(), new Date().getMinutes()) }],
      recurring: recurring || undefined, creationApproval: needsSignoff ? 'pending' : 'approved', incoming: cross && effectiveTeam !== me.team,
      approvalToken: token(), createdAt: new Date().toISOString(),
    };
    addTask(task);
    toast(cross ? `Request routed to ${effectiveTeam} incoming queue` : needsSignoff ? 'Created — waiting for Team Lead sign-off' : 'Task created');
    onClose();
  };

  return (
    <Modal onClose={onClose} title="Create task" icon={<Sparkles size={20} color="var(--primary)" />}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={submit}>Create Task</button></>}>
      <div className="col" style={{ gap: 18 }}>
        <div>
          <h3 className="sec-title">Quick-start templates</h3>
          <div className="grid g3" style={{ gap: 10 }}>
            {templates.map((t) => (
              <button key={t.id} className={`tpl ${tpl === t.id ? 'on' : ''}`} onClick={() => applyTemplate(t.id)}>
                <b style={{ display: 'block' }}>{t.name}</b>
                <span className="muted" style={{ fontSize: 12 }}>{t.subtasks.length} subtasks · {t.estHours}h{t.recurring ? ` · ${t.recurring}` : ''}</span>
              </button>
            ))}
          </div>
        </div>

        <Field label="Title"><input className="input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Homepage build — Coastline Cardiology" /></Field>
        <Field label="Description"><textarea className="textarea" value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>

        <div className="grid g2">
          <Field label="Client">
            <select className="select" value={clientId} onChange={(e) => { setClientId(e.target.value); setProjectId(''); }}>
              <option value="">Select client…</option>
              {approvedClients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.approved ? '' : ' (awaiting approval)'}</option>)}
              <option value="__new">+ Add new client…</option>
            </select>
          </Field>
          {clientId === '__new'
            ? <Field label="New client name"><input className="input" value={newClient} onChange={(e) => setNewClient(e.target.value)} placeholder={isAdmin ? 'Client name' : 'Goes to admin approval queue'} /></Field>
            : <Field label="Project"><select className="select" value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={!client}><option value="">No project</option>{client?.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>}
        </div>

        <div className="card" style={{ padding: 14, background: 'var(--surface-2)', boxShadow: 'none' }}>
          <label className="row"><input type="checkbox" checked={cross} onChange={(e) => setCross(e.target.checked)} /><b>Cross-team request</b><span className="muted">Route into another department's incoming queue</span></label>
          {cross && <div style={{ marginTop: 10 }}><Field label="Target team"><select className="select" value={targetTeam} onChange={(e) => setTargetTeam(e.target.value as Team)}>{(['Development', 'Marketing', 'Creative'] as Team[]).map((t) => <option key={t}>{t}</option>)}</select></Field></div>}
        </div>

        <div className="grid g3">
          {!cross && <Field label="Team"><select className="select" value={team} onChange={(e) => setTeam(e.target.value as Team)}>{(['Development', 'Marketing', 'Creative'] as Team[]).map((t) => <option key={t}>{t}</option>)}</select></Field>}
          <Field label="Priority"><select className="select" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>{(['low', 'medium', 'high', 'critical', 'urgent'] as Priority[]).map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}</select></Field>
          {!cross && <Field label="Assignee"><select className="select" value={assignee} onChange={(e) => setAssignee(e.target.value)}><option value="">Unassigned</option>{people.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>}
          <Field label="Due date"><input className="input" type="date" min={day(0)} value={due} onChange={(e) => setDue(e.target.value)} /></Field>
          <Field label="Estimated hours"><input className="input" type="number" min="0" step="0.5" value={est} onChange={(e) => setEst(parseFloat(e.target.value) || 0)} /></Field>
          <Field label="Labels (comma separated)"><input className="input" value={labels} onChange={(e) => setLabels(e.target.value)} placeholder="Figma, Mobile" /></Field>
        </div>

        <div className="grid g2">
          <Field label="Recurring">
            <div className="row"><RefreshCw size={16} className="muted" />
              <select className="select" value={recurring} onChange={(e) => setRecurring(e.target.value as '' | Frequency)}>
                <option value="">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option>
              </select></div>
          </Field>
          <Field label="Attachments (max 5MB each)">
            <button className="btn" type="button" onClick={() => fileRef.current?.click()}><Paperclip size={15} /> {files.length ? `${files.length} file(s) attached` : 'Add files'}</button>
            <input ref={fileRef} hidden multiple type="file" onChange={(e) => addFiles(e.target.files)} />
          </Field>
        </div>

        {subtasks.length > 0 && (
          <div><h3 className="sec-title">Subtask checklist (from template)</h3>
            {subtasks.map((s, i) => <div key={i} className="subtask"><span className="grow">{s}</span><button className="btn sm ghost" onClick={() => setSubtasks(subtasks.filter((_, j) => j !== i))}>Remove</button></div>)}
          </div>
        )}
        {!isLead && <div className="banner-warn">As a Team Member, your task will wait for Team Lead / Super Admin sign-off before work can start.</div>}
      </div>
    </Modal>
  );
}
