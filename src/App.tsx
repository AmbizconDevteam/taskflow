import type React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { useStore } from './store';
import Overview from './pages/Overview';
import Board from './pages/Board';
import Queue from './pages/Queue';
import Attendance from './pages/Attendance';
import Reimbursements from './pages/Reimbursements';
import Clients from './pages/Clients';
import { Analytics, Reports } from './pages/Insights';
import { Approvals, Directory, Finance } from './pages/Admin';
import { Profile, Settings } from './pages/Profile';
import Share from './pages/Share';

export default function App() {
  const { toasts, isAdmin, isLead } = useStore();
  const guard = (ok: boolean, el: React.ReactElement) => (ok ? el : <Navigate to="/" replace />);
  return (
    <>
      <Routes>
        <Route path="/share/:token" element={<Share />} />
        <Route element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="board" element={<Board />} />
          <Route path="queue" element={<Queue />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="reimbursements" element={<Reimbursements />} />
          <Route path="clients" element={<Clients />} />
          <Route path="reports" element={guard(isLead, <Reports />)} />
          <Route path="analytics" element={guard(isLead, <Analytics />)} />
          <Route path="directory" element={guard(isAdmin, <Directory />)} />
          <Route path="approvals" element={guard(isAdmin, <Approvals />)} />
          <Route path="finance" element={guard(isAdmin, <Finance />)} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <div className="toasts">{toasts.map((t) => <div key={t.id} className={`toast ${t.kind === 'err' ? 'err' : ''}`}>{t.text}</div>)}</div>
    </>
  );
}
