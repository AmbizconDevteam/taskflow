import { Bell, CalendarClock, ChevronDown, Info, Repeat } from 'lucide-react';
import { useState } from 'react';
import type { Reminder } from '../types';
import { fmtDate } from './ui';

// UI-only draft of the reminder; converted to Task.reminder on create.
export interface ReminderDraft {
  enabled: boolean;
  frequency: Reminder['frequency'];
  every: number;
  unit: NonNullable<Reminder['unit']>;
  date: string;
  time: string;
  endMode: 'never' | 'date';
  until: string;
}

export const emptyReminder: ReminderDraft = { enabled: false, frequency: 'monthly', every: 2, unit: 'weeks', date: '', time: '10:00', endMode: 'never', until: '' };

const FREQ: { value: Reminder['frequency']; label: string }[] = [
  { value: 'once', label: 'Once (no repeat)' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom…' },
];
const BEFORE = [30, 14, 7, 1];
const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2), m = i % 2 ? '30' : '00';
  return { value: `${String(h).padStart(2, '0')}:${m}`, label: `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}` };
});
const timeLabel = (v: string) => TIMES.find((t) => t.value === v)?.label ?? v;
const ordinal = (n: number) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
const shift = (iso: string, days: number) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() - days); return d.toISOString().slice(0, 10); };

export function reminderSummary(r: ReminderDraft): string {
  if (!r.date) return 'Pick a reminder date to see when you will be reminded.';
  const d = new Date(r.date + 'T00:00:00');
  const at = timeLabel(r.time);
  const end = r.endMode === 'date' && r.until ? ` until ${fmtDate(r.until)}` : r.frequency === 'once' ? '' : ' with no end date';
  switch (r.frequency) {
    case 'once': return `You will be reminded once on ${fmtDate(r.date)} at ${at}.`;
    case 'daily': return `You will be reminded every day at ${at}, starting ${fmtDate(r.date)}${end}.`;
    case 'weekly': return `You will be reminded every ${d.toLocaleDateString('en-GB', { weekday: 'long' })} at ${at}${end}.`;
    case 'monthly': return `You will be reminded monthly on the ${ordinal(d.getDate())} at ${at}${end}.`;
    case 'yearly': return `You will be reminded every year on ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} at ${at}${end}.`;
    default: return `You will be reminded every ${r.every} ${r.every === 1 ? r.unit.slice(0, -1) : r.unit} at ${at}, starting ${fmtDate(r.date)}${end}.`;
  }
}

export function reminderError(r: ReminderDraft, today: string): string | null {
  if (!r.enabled) return null;
  if (!r.date) return 'Choose a reminder date';
  if (r.date < today) return 'Reminder date cannot be in the past';
  if (r.frequency === 'custom' && !(r.every >= 1)) return 'Custom repeat needs a number of 1 or more';
  if (r.frequency !== 'once' && r.endMode === 'date') {
    if (!r.until) return 'Choose the date the reminder should stop';
    if (r.until < r.date) return 'Repeat-until date must be on or after the reminder date';
  }
  return null;
}

const Switch = ({ on, onChange, id }: { on: boolean; onChange: (v: boolean) => void; id: string }) => (
  <button id={id} type="button" role="switch" aria-checked={on} className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)}><i /></button>
);

export function ReminderSection({ value: r, onChange, dueDate, today }: { value: ReminderDraft; onChange: (r: ReminderDraft) => void; dueDate: string; today: string }) {
  const [open, setOpen] = useState(r.enabled);
  const set = (p: Partial<ReminderDraft>) => onChange({ ...r, ...p });
  const toggle = (enabled: boolean) => { set({ enabled, date: enabled && !r.date ? dueDate || today : r.date }); if (enabled) setOpen(true); };
  const repeats = r.frequency !== 'once';
  const err = reminderError(r, today);

  return (
    <section className={`rem ${r.enabled ? 'is-on' : ''}`}>
      <button type="button" className="rem-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="rem-icon"><Bell size={17} /></span>
        <span className="grow" style={{ textAlign: 'left' }}>
          <b>Reminder &amp; Recurrence</b>
          <span className="muted" style={{ display: 'block', fontSize: 12.5, marginTop: 1 }}>
            {r.enabled ? `${FREQ.find((f) => f.value === r.frequency)?.label.replace(/ \(.*|…/, '')}${r.date ? ` · from ${fmtDate(r.date)}` : ''} · ${timeLabel(r.time)}` : 'Off — get nudged before work slips'}
          </span>
        </span>
        {r.enabled && <span className="chip green">ON</span>}
        <ChevronDown size={18} className={`chev ${open ? 'up' : ''}`} />
      </button>

      {open && (
        <div className="rem-body">
          <div className="rem-row">
            <label htmlFor="rem-enable"><b>Enable Reminder</b><span className="muted"> — notify the assignee by in-app alert</span></label>
            <Switch id="rem-enable" on={r.enabled} onChange={toggle} />
          </div>

          {r.enabled && (
            <>
              <div className="rem-grid">
                <div className="field">
                  <label htmlFor="rem-freq">Reminder Frequency</label>
                  <div className="with-icon"><Repeat size={15} /><select id="rem-freq" className="select" value={r.frequency} onChange={(e) => set({ frequency: e.target.value as Reminder['frequency'] })}>
                    {FREQ.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select></div>
                </div>
                <div className="field">
                  <label htmlFor="rem-date">Reminder Date</label>
                  <div className="with-icon"><CalendarClock size={15} /><input id="rem-date" className="input" type="date" min={today} value={r.date} onChange={(e) => set({ date: e.target.value })} /></div>
                  <small className="muted">{dueDate ? <>Task due <b>{fmtDate(dueDate)}</b> — the reminder is separate from the deadline.</> : 'Separate from the task due date.'}</small>
                </div>
                <div className="field">
                  <label htmlFor="rem-time">Reminder Time</label>
                  <select id="rem-time" className="select" value={r.time} onChange={(e) => set({ time: e.target.value })}>
                    {TIMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {r.frequency === 'custom' && (
                <div className="rem-grid">
                  <div className="field"><label htmlFor="rem-every">Repeat every</label>
                    <input id="rem-every" className="input" type="number" min={1} value={r.every} onChange={(e) => set({ every: parseInt(e.target.value, 10) || 0 })} /></div>
                  <div className="field"><label htmlFor="rem-unit">Unit</label>
                    <select id="rem-unit" className="select" value={r.unit} onChange={(e) => set({ unit: e.target.value as ReminderDraft['unit'] })}><option value="days">Days</option><option value="weeks">Weeks</option><option value="months">Months</option></select></div>
                </div>
              )}

              <div className="field">
                <label>Remind before due date <span className="muted" style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>(handy for renewals and expiries)</span></label>
                <div className="row wrap" style={{ gap: 8 }}>
                  {BEFORE.map((n) => (
                    <button key={n} type="button" disabled={!dueDate} title={dueDate ? '' : 'Set a due date first'}
                      className={`chip filter ${dueDate && r.date === shift(dueDate, n) ? 'on' : ''}`}
                      onClick={() => set({ date: shift(dueDate, n), frequency: 'once' })}>{n} {n === 1 ? 'day' : 'days'} before</button>
                  ))}
                </div>
              </div>

              {repeats && (
                <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
                  <legend>Repeat Task</legend>
                  <div className="row wrap" style={{ gap: 18 }}>
                    <label className="radio"><input type="radio" name="rem-end" checked={r.endMode === 'never'} onChange={() => set({ endMode: 'never' })} /> Never ends</label>
                    <label className="radio"><input type="radio" name="rem-end" checked={r.endMode === 'date'} onChange={() => set({ endMode: 'date', until: r.until || shiftYear(r.date) })} /> Repeat until</label>
                    <input id="rem-until" aria-label="Repeat until date" className="input" style={{ width: 190 }} type="date" min={r.date || today} disabled={r.endMode !== 'date'} value={r.until} onChange={(e) => set({ until: e.target.value })} />
                  </div>
                </fieldset>
              )}

              <div className={`callout ${err ? 'bad' : ''}`} role="status"><Info size={16} /><span>{err ?? reminderSummary(r)}</span></div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function shiftYear(iso: string) {
  const d = new Date((iso || new Date().toISOString().slice(0, 10)) + 'T00:00:00');
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}
