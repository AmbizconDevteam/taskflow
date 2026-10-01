import { AlarmClock, BarChart3, Bell, Building2, Camera, ChevronDown, FileBarChart, IdCard, Inbox, LayoutDashboard, LogOut, Moon, Plus, RefreshCw, Search, Settings, ShieldCheck, Sun, Users, Wallet, Receipt, Kanban, Cake } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Avatar } from './ui';
import { CreateTaskModal } from '../pages/CreateTask';

const roleLabel = { super_admin: 'Super Admin', team_lead: 'Team Lead', member: 'Team Member', reception: 'Reception' } as const;

export default function Layout() {
  const { me, users, tasks, isAdmin, isLead, setMe, toggleTheme, theme, resetDemo, roleRequests, clients, toast } = useStore();
  const [menu, setMenu] = useState(false);
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState('');
  const nav = useNavigate();

  const incoming = tasks.filter((t) => t.incoming && (isAdmin || t.team === me.team)).length;
  const approvals = roleRequests.filter((r) => r.status === 'pending').length + clients.filter((c) => !c.approved).length;
  const mine = tasks.filter((t) => t.assigneeId === me.id && t.status !== 'done').length;

  const link = (to: string, icon: React.ReactNode, label: string, pill?: string | number) => (
    <NavLink to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
      {icon}<span>{label}</span>{pill !== undefined && pill !== 0 && <i className="pill" style={{ fontStyle: 'normal' }}>{pill}</i>}
    </NavLink>
  );

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">B</div>
          <div><b>BIZZY</b><small>BRISBANE HQ • GLOBAL</small></div>
        </div>
        <div className="workspace-card">
          <div className="brand-mark" style={{ width: 38, height: 38, fontSize: 15, borderRadius: 12 }}>{me.team?.[0] ?? 'A'}</div>
          <div><b style={{ display: 'block' }}>{me.team ? `${me.team} Team` : 'Ambizcon'}</b><small className="muted">TaskFlow Enterprise</small></div>
        </div>
        <div className="nav-label">MAIN WORKSPACE</div>
        <nav className="nav">
          {link('/', <LayoutDashboard size={19} />, 'Overview')}
          {link('/board', <Kanban size={19} />, 'Bizzy Board', mine)}
          {link('/queue', <Inbox size={19} />, 'Incoming Queue', incoming || undefined)}
          {link('/attendance', <AlarmClock size={19} />, 'Attendance & Leave')}
          {link('/reimbursements', <Receipt size={19} />, 'Reimbursements')}
          {link('/clients', <Building2 size={19} />, 'Clients & Sites')}
          {isLead && link('/reports', <FileBarChart size={19} />, 'Reports')}
          {isLead && link('/analytics', <BarChart3 size={19} />, 'Analytics')}
          {isAdmin && link('/directory', <Users size={19} />, 'User Directory')}
          {isAdmin && link('/approvals', <ShieldCheck size={19} />, 'Role Approvals', approvals)}
          {isAdmin && link('/finance', <Wallet size={19} />, 'Company Finance')}
          {link('/profile', <IdCard size={19} />, 'My Profile')}
          {link('/settings', <Settings size={19} />, 'Settings')}
        </nav>
        <div className="side-foot">
          <div className="me-card">
            <Avatar user={me} />
            <div className="grow"><b style={{ display: 'block' }}>{me.name}</b><small className="muted">{roleLabel[me.role]}</small></div>
          </div>
          <button className="btn soft-danger" onClick={() => toast('Demo build: sign-in is not wired yet — use the persona switcher')}><LogOut size={16} /><span>Log Out</span></button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <label className="search">
            <Search size={16} />
            <input placeholder="Search tasks…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && nav(`/board?q=${encodeURIComponent(q)}`)} />
          </label>
          <div className="rel">
            <button className="btn" style={{ background: 'var(--green-soft)', borderColor: 'transparent', height: 48 }} onClick={() => setMenu((v) => !v)}>
              <Avatar user={{ name: me.branch }} /> <b>{me.branch}</b> {isAdmin && <span className="chip" style={{ background: 'var(--amber-soft)', color: '#b9760c', borderColor: 'transparent' }}>ADMIN</span>}
              <ChevronDown size={16} />
            </button>
            {menu && (
              <div className="menu" onMouseLeave={() => setMenu(false)}>
                <div className="sec-title" style={{ padding: '6px 10px 2px' }}>Demo: switch persona</div>
                {users.map((u) => (
                  <button key={u.id} onClick={() => { setMe(u.id); setMenu(false); nav('/board'); }}>
                    <Avatar user={u} /><span className="grow"><b>{u.name}</b><br /><small className="muted">{roleLabel[u.role]}{u.team ? ` · ${u.team}` : ''}</small></span>
                  </button>
                ))}
                <button onClick={() => { resetDemo(); setMenu(false); }}><RefreshCw size={16} /> Reset demo data</button>
              </div>
            )}
          </div>
          <div className="grow" />
          <button className="btn" style={{ background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }} onClick={() => nav('/attendance')}><Camera size={16} /> Scan Office QR</button>
          <button className="btn primary" onClick={() => setCreating(true)}><Plus size={17} /> New Task</button>
          <button className="btn icon" onClick={() => window.location.reload()} aria-label="Refresh"><RefreshCw size={17} /></button>
          <button className="btn icon" style={{ background: 'var(--amber-soft)', borderColor: 'transparent' }} aria-label="Birthdays"><Cake size={17} color="#b9760c" /></button>
          <button className="btn icon" onClick={toggleTheme} aria-label="Toggle theme">{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}</button>
          <button className="btn icon" aria-label="Notifications"><Bell size={17} /><span className="badge-dot">{Math.min(9, incoming + approvals + mine)}</span></button>
          <button className="btn" onClick={() => nav('/profile')}>{me.name} <ChevronDown size={15} /></button>
        </header>
        <main className="content"><Outlet /></main>
      </div>
      {creating && <CreateTaskModal onClose={() => setCreating(false)} />}
    </div>
  );
}
