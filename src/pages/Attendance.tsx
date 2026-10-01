import { AlarmClock, Coffee, Download, LogIn, LogOut, QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { day } from '../data/seed';
import type { AttendanceDay, BreakKind } from '../types';
import { Field, Modal, csv, download, fmtDate, fmtTime } from '../components/ui';

const mins = (d: AttendanceDay, now = Date.now()) => {
  if (!d.clockIn) return 0;
  const end = d.clockOut ? new Date(d.clockOut).getTime() : now;
  const brk = d.breaks.reduce((a, b) => a + ((b.end ? new Date(b.end).getTime() : now) - new Date(b.start).getTime()), 0);
  return Math.max(0, Math.round((end - new Date(d.clockIn).getTime() - brk) / 60000));
};
const hm = (m: number) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;

export default function Attendance() {
  const { me, users, attendance, clockIn, clockOut, startBreak, endBreak, requestCorrection, isLead, toast } = useStore();
  const [, tick] = useState(0);
  const [fix, setFix] = useState<string | null>(null);
  const [note, setNote] = useState('');
  useEffect(() => { const i = setInterval(() => tick((n) => n + 1), 30000); return () => clearInterval(i); }, []);

  const mine = attendance[me.id] ?? [];
  const today = mine.find((d) => d.date === day(0));
  const onBreak = today?.breaks.find((b) => !b.end);
  const week = mine.slice(0, 7);
  const weekMins = week.reduce((a, d) => a + mins(d), 0);

  const exportCsv = (scope: 'me' | 'team') => {
    const rows: (string | number)[][] = [['Name', 'Date', 'Status', 'Clock in', 'Clock out', 'Break min', 'Worked min']];
    const people = scope === 'me' ? [me] : users.filter((u) => u.role !== 'reception');
    for (const u of people) {
      const list = attendance[u.id] ?? [];
      if (list.length === 0) rows.push([u.name, day(0), 'Absent', '', '', 0, 0]);
      for (const d of list) rows.push([u.name, d.date, d.clockIn ? 'Present' : 'Absent', fmtTime(d.clockIn), fmtTime(d.clockOut), d.breaks.reduce((a, b) => a + Math.round(((b.end ? new Date(b.end).getTime() : Date.now()) - new Date(b.start).getTime()) / 60000), 0), mins(d)]);
    }
    download(`attendance-${day(0)}.csv`, csv(rows));
  };

  return (
    <>
      <div className="row"><h1 className="page-title grow row"><AlarmClock /> Attendance &amp; Leave <span className="chip purple">Ambizcon Pulse</span></h1>
        <button className="btn" onClick={() => exportCsv('me')}><Download size={15} /> My CSV</button>
        {isLead && <button className="btn" onClick={() => exportCsv('team')}><Download size={15} /> Team CSV</button>}</div>
      <p className="page-sub">Clock in, track breaks and review your hours.</p>

      <div className="grid g3" style={{ marginBottom: 16 }}>
        <div className="card col" style={{ gap: 14 }}>
          <h3>Today · {fmtDate(new Date().toISOString())}</h3>
          <div className="stat"><b className="mono">{hm(today ? mins(today) : 0)}</b><span>{today?.clockIn ? `In at ${fmtTime(today.clockIn)}${today.clockOut ? ` · out ${fmtTime(today.clockOut)}` : ''}` : 'Not clocked in'}</span></div>
          {!today && <button className="btn primary" onClick={() => { clockIn(); toast('Clocked in — have a great day'); }}><LogIn size={16} /> Clock in</button>}
          {today && !today.clockOut && (
            <>
              {onBreak
                ? <button className="btn" onClick={endBreak}><Coffee size={16} /> End {onBreak.kind} break</button>
                : <div className="row wrap">{(['Lunch', 'Tea', 'Personal', 'Meeting'] as BreakKind[]).map((k) => <button key={k} className="btn sm" onClick={() => startBreak(k)}><Coffee size={13} /> {k}</button>)}</div>}
              <button className="btn danger" onClick={() => { clockOut(); toast('Clocked out'); }}><LogOut size={16} /> Clock out</button>
            </>
          )}
          {today?.clockOut && <span className="chip green">Day complete</span>}
        </div>
        <div className="card stat"><b className="mono">{hm(weekMins)}</b><span>Last {week.length || 0} working days</span></div>
        <div className="card col">
          <h3 className="row"><QrCode size={18} /> Office QR</h3>
          <p className="muted" style={{ margin: 0 }}>Scan the reception QR on arrival to clock in from your phone. (Camera scanning is wired in the production app.)</p>
          <button className="btn" onClick={() => { if (!today) { clockIn(); toast('Clocked in via QR'); } else toast('Already clocked in today'); }}>Simulate scan</button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 8 }}>History</h3>
        <table>
          <thead><tr><th>Date</th><th>In</th><th>Out</th><th>Breaks</th><th>Worked</th><th /></tr></thead>
          <tbody>
            {mine.length === 0 && <tr><td colSpan={6} className="muted">No records yet.</td></tr>}
            {mine.map((d) => (
              <tr key={d.date}><td>{fmtDate(d.date)}</td><td>{fmtTime(d.clockIn)}</td><td>{fmtTime(d.clockOut)}</td><td>{d.breaks.map((b) => b.kind).join(', ') || '—'}</td><td className="mono">{hm(mins(d))}</td>
                <td>{d.correction ? <span className="chip approval">Correction {d.correction.status}</span> : <button className="btn sm" onClick={() => { setFix(d.date); setNote(''); }}>Request correction</button>}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      {fix && (
        <Modal size="sm" title={`Correction for ${fmtDate(fix)}`} onClose={() => setFix(null)}
          footer={<><button className="btn" onClick={() => setFix(null)}>Cancel</button><button className="btn primary" onClick={() => { if (!note.trim()) return toast('Explain what to correct', 'err'); requestCorrection(fix, note.trim()); setFix(null); toast('Sent to your Team Lead'); }}>Send request</button></>}>
          <Field label="What needs correcting?"><textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Forgot to clock out — left at 6:30pm" /></Field>
        </Modal>
      )}
    </>
  );
}
