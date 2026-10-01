import { Lock, Save, Settings as Cog } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store';
import type { User } from '../types';
import { Avatar, Field } from '../components/ui';

type Editable = Pick<User, 'phone' | 'emergencyContact' | 'address' | 'bloodGroup' | 'qualification' | 'experience' | 'skills' | 'workMode' | 'birthday'>;

export function Profile() {
  const { me, patchUser, toast } = useStore();
  const [f, setF] = useState<Editable>({ phone: me.phone, emergencyContact: me.emergencyContact, address: me.address, bloodGroup: me.bloodGroup, qualification: me.qualification, experience: me.experience, skills: me.skills, workMode: me.workMode, birthday: me.birthday });
  const set = <K extends keyof Editable>(k: K, v: Editable[K]) => setF((p) => ({ ...p, [k]: v }));
  const text = (k: keyof Editable, label: string, type = 'text') => <Field label={label}><input className="input" type={type} value={(f[k] as string) ?? ''} onChange={(e) => set(k, e.target.value as never)} /></Field>;
  return (
    <>
      <h1 className="page-title">My Profile</h1>
      <p className="page-sub">Update personal details. Email and access role are managed by admins.</p>
      <div className="grid" style={{ gridTemplateColumns: '300px 1fr' }}>
        <div className="card col" style={{ alignItems: 'center', textAlign: 'center', alignSelf: 'start' }}>
          <Avatar user={me} large /><h3>{me.name}</h3><span className="chip client">{me.role.replace('_', ' ')}</span>
          <div className="muted" style={{ fontSize: 13 }}>{me.branch}{me.team ? ` · ${me.team}` : ''}</div>
          <div className="row muted" style={{ fontSize: 12 }}><Lock size={13} /> {me.email}</div>
        </div>
        <div className="card col" style={{ gap: 16 }}>
          <div className="grid g2">
            {text('phone', 'Phone')}{text('emergencyContact', 'Emergency contact')}{text('bloodGroup', 'Blood group')}{text('birthday', 'Birthday', 'date')}
            <Field label="Work mode"><select className="select" value={f.workMode ?? ''} onChange={(e) => set('workMode', (e.target.value || undefined) as Editable['workMode'])}><option value="">—</option><option>Office</option><option>Remote</option><option>Hybrid</option></select></Field>
            {text('skills', 'Skills stack')}
          </div>
          <Field label="Residential address"><textarea className="textarea" value={f.address ?? ''} onChange={(e) => set('address', e.target.value)} /></Field>
          <Field label="Educational qualifications"><textarea className="textarea" value={f.qualification ?? ''} onChange={(e) => set('qualification', e.target.value)} /></Field>
          <Field label="Work experience"><textarea className="textarea" value={f.experience ?? ''} onChange={(e) => set('experience', e.target.value)} /></Field>
          <div><button className="btn primary" onClick={() => { patchUser(me.id, f); toast('Profile saved'); }}><Save size={15} /> Save changes</button></div>
        </div>
      </div>
    </>
  );
}

export function Settings() {
  const { theme, toggleTheme, resetDemo } = useStore();
  return (
    <>
      <h1 className="page-title row"><Cog /> Settings</h1>
      <p className="page-sub">Workspace preferences.</p>
      <div className="card col" style={{ maxWidth: 560 }}>
        <div className="row"><div className="grow"><b>Dark mode</b><div className="muted">Currently {theme}</div></div><button className="btn" onClick={toggleTheme}>Switch to {theme === 'light' ? 'dark' : 'light'}</button></div>
        <hr style={{ border: 0, borderTop: '1px solid var(--border)', width: '100%' }} />
        <div className="row"><div className="grow"><b>Reset demo data</b><div className="muted">Restore the seeded sample workspace.</div></div><button className="btn soft-danger" onClick={resetDemo}>Reset</button></div>
      </div>
    </>
  );
}
