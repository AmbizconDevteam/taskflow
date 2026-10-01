import type { AttendanceDay, Claim, Client, Frequency, Priority, RoleRequest, Status, Task, Team, User } from '../types';

export const iso = (offsetDays = 0, hour = 9, min = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};
export const day = (offsetDays = 0) => iso(offsetDays).slice(0, 10);
export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}`;
export const token = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, '0')).join('');

export const users: User[] = [
  { id: 'u1', name: 'Mathan P', email: 'mathan@ambizcon.com', role: 'super_admin', branch: 'Ambizcon', phone: '+91 98400 11001', workMode: 'Hybrid', skills: 'Strategy, Operations' },
  { id: 'u2', name: 'Anirudh', email: 'anirudh@ambizcon.com', role: 'super_admin', branch: 'India & Australia' },
  { id: 'u3', name: 'Aravind', email: 'aravind@ambizcon.com', role: 'team_lead', team: 'Development', branch: 'Ambizcon Health - India', skills: 'WordPress, React, PHP' },
  { id: 'u4', name: 'Kenneth', email: 'kenneth@ambizcon.com', role: 'team_lead', team: 'Marketing', branch: 'India & Australia', skills: 'SEO, Google Ads' },
  { id: 'u5', name: 'Deva Priya D A', email: 'deva@ambizcon.com', role: 'team_lead', team: 'Creative', branch: 'Ambizcon', skills: 'Figma, Branding' },
  { id: 'u6', name: 'Priya S', email: 'priya@ambizcon.com', role: 'member', team: 'Development', branch: 'Ambizcon Health - India', skills: 'WordPress, Elementor' },
  { id: 'u7', name: 'Karthik R', email: 'karthik@ambizcon.com', role: 'member', team: 'Development', branch: 'Ambizcon', skills: 'React, Node' },
  { id: 'u8', name: 'Sneha M', email: 'sneha@ambizcon.com', role: 'member', team: 'Marketing', branch: 'India & Australia', skills: 'SEO, Content' },
  { id: 'u9', name: 'Rahul K', email: 'rahul@ambizcon.com', role: 'member', team: 'Creative', branch: 'Ambizcon', skills: 'Figma, Illustrator' },
  { id: 'u10', name: 'Meera N', email: 'meera@ambizcon.com', role: 'reception', branch: 'Ambizcon Health - India' },
];

export const clients: Client[] = [
  {
    id: 'c1', name: 'Apollo Hospitals', short: 'Apollo', approved: true,
    projects: [{ id: 'p1', name: '2026 Patient Portal Redesign' }, { id: 'p2', name: 'SEO Retainer 2026' }],
    sites: [{ id: 's1', label: 'Main site', liveUrl: 'https://apollo-demo.example.com', stagingUrl: 'https://staging.apollo-demo.example.com', host: 'Kinsta', credentialsRef: '1Password › Clients › Apollo › WP Admin', notes: 'Weekly backups on Sunday' }],
    services: [{ name: 'WordPress Maintenance', monthlyHours: 10, monthlyFee: 1800 }, { name: 'SEO', monthlyHours: 25, monthlyFee: 3200 }],
  },
  {
    id: 'c2', name: 'Manipal Hospitals', short: 'Manipal', approved: true,
    projects: [{ id: 'p3', name: 'Social Media 2026' }],
    sites: [{ id: 's2', label: 'Corporate site', liveUrl: 'https://manipal-demo.example.com', host: 'WP Engine', credentialsRef: 'Bitwarden › Manipal › Hosting' }],
    services: [{ name: 'Social Media', monthlyHours: 30, monthlyFee: 2400 }],
  },
  {
    id: 'c3', name: 'DM Healthcare', short: 'DM Healthcare', approved: true,
    projects: [{ id: 'p4', name: 'Brand Refresh' }],
    sites: [{ id: 's3', label: 'Main site', liveUrl: 'https://dm-demo.example.com', host: 'SiteGround', credentialsRef: '1Password › Clients › DM Healthcare' }],
    services: [{ name: 'Creative Retainer', monthlyHours: 20, monthlyFee: 2000 }],
  },
  {
    id: 'c4', name: 'Fortis Healthcare', short: 'Fortis', approved: true,
    projects: [{ id: 'p5', name: 'Local SEO + Reviews' }],
    sites: [], services: [{ name: 'Local SEO', monthlyHours: 15, monthlyFee: 1500 }],
  },
  {
    id: 'c5', name: 'Coastline Cardiology', short: 'Coastline', approved: true,
    projects: [{ id: 'p6', name: 'Website Build' }],
    sites: [{ id: 's5', label: 'New site', liveUrl: 'https://coastline-demo.example.com', stagingUrl: 'https://stg.coastline-demo.example.com', host: 'Kinsta', credentialsRef: '1Password › Clients › Coastline' }],
    services: [{ name: 'WordPress Build', monthlyHours: 40, monthlyFee: 4200 }],
  },
  {
    id: 'c6', name: 'Northside Family Practice', short: 'Northside', approved: true,
    projects: [{ id: 'p7', name: 'Google Ads 2026' }],
    sites: [], services: [{ name: 'Google Ads', monthlyHours: 12, monthlyFee: 1100 }],
  },
  { id: 'c7', name: 'Lakeview Dental', short: 'Lakeview', approved: false, addedBy: 'u4', projects: [], sites: [], services: [] },
];

export interface Template {
  id: string;
  name: string;
  team: Team;
  estHours: number;
  labels: string[];
  priority: Priority;
  recurring?: Frequency;
  subtasks: string[];
}

export const templates: Template[] = [
  { id: 't1', name: 'WordPress Site Build', team: 'Development', estHours: 40, labels: ['WordPress'], priority: 'high',
    subtasks: ['Collect brand assets & content', 'Set up hosting + staging', 'Install theme & plugins', 'Build pages', 'Mobile + speed check', 'Internal review', 'Client approval', 'Go live + DNS'] },
  { id: 't2', name: 'Monthly SEO Audit', team: 'Marketing', estHours: 6, labels: ['SEO'], priority: 'medium', recurring: 'monthly',
    subtasks: ['Pull Search Console + Analytics data', 'Rank tracking snapshot', 'Technical crawl', 'Write summary + next-month plan', 'Send report to client'] },
  { id: 't3', name: 'Google Ads Campaign Setup', team: 'Marketing', estHours: 8, labels: ['Ads'], priority: 'high',
    subtasks: ['Keyword research', 'Account + conversion tracking', 'Ad groups & copy', 'Landing page check', 'Launch + budget caps'] },
  { id: 't4', name: 'WP Security & Plugin Updates', team: 'Development', estHours: 2, labels: ['WordPress', 'Security'], priority: 'medium', recurring: 'monthly',
    subtasks: ['Backup site', 'Update core, themes, plugins', 'Check forms, uptime, broken links', 'Security scan'] },
  { id: 't5', name: 'Speed & Core Web Vitals Optimization', team: 'Development', estHours: 5, labels: ['WordPress', 'Performance'], priority: 'medium',
    subtasks: ['Baseline Lighthouse / CWV', 'Image + font optimisation', 'Caching + CDN', 'Remove render-blocking scripts', 'Re-test + report'] },
];

const t = (n: number, title: string, description: string, status: Status, priority: Priority, team: Team, clientId: string, assigneeId: string | undefined, createdBy: string, labels: string[], dueIn: number | undefined, extra: Partial<Task> = {}): Task => ({
  id: `T-${100 + n}`, title, description, status, priority, team, clientId,
  projectId: undefined, assigneeId, createdBy, labels,
  due: dueIn === undefined ? undefined : day(dueIn),
  estHours: 4, timeEntries: [], subtasks: [], attachments: [], comments: [],
  history: [{ id: uid('h'), userId: createdBy, text: 'Created this task', at: iso(-6 - (n % 5), 10) }],
  creationApproval: 'approved', incoming: false, approvalToken: token(), createdAt: iso(-6 - (n % 5), 10),
  ...extra,
});
const subs = (...items: [string, boolean][]) => items.map(([title, done], i) => ({ id: `st${i}${Math.random().toString(36).slice(2, 5)}`, title, done }));

export const tasks: Task[] = [
  t(1, 'Social Media Banners & Ads', 'Vector illustrations for upcoming healthcare campaign across Meta and LinkedIn.', 'todo', 'critical', 'Creative', 'c2', 'u9', 'u5', ['Figma', 'Marketing'], 5, { estHours: 6, projectId: 'p3', subtasks: subs(['Moodboard', true], ['Banner set A', false], ['Banner set B', false]) }),
  t(2, 'Figma UI/UX Design System', 'Create reusable button variants, form fields and card components for the portal.', 'in_progress', 'critical', 'Creative', 'c3', 'u9', 'u5', ['Figma', 'UI/UX'], 3, { estHours: 16, projectId: 'p4', creationApproval: 'pending', createdBy: 'u9', subtasks: subs(['Colour tokens', true], ['Buttons', true], ['Forms', false], ['Cards', false]) }),
  t(3, 'Mobile App Wireframes & Prototype', 'High-fidelity wireframes for iOS and Android patient app.', 'review', 'medium', 'Creative', 'c1', 'u9', 'u5', ['Figma', 'Mobile', 'Wireframes'], 2, { estHours: 14, reviewerId: 'u5', projectId: 'p1', subtasks: subs(['Flows', true], ['Low-fi', true], ['High-fi', true]), attachments: [{ id: 'a1', name: 'wireframe-v3.png', size: 420000, type: 'image/png' }] }),
  t(4, 'Monthly Marketing ROI & CAC Report', 'Calculate Customer Acquisition Cost and ROI across channels.', 'support', 'high', 'Marketing', 'c1', 'u8', 'u4', ['SEO', 'Marketing'], 4, { estHours: 5, recurring: 'monthly', projectId: 'p2' }),
  t(5, 'Brand Reputation & Review System', 'Monitor Google My Business ratings and respond to reviews.', 'done', 'low', 'Marketing', 'c4', 'u8', 'u4', ['SEO'], -1, { estHours: 3, projectId: 'p5', completedAt: iso(-1, 16), timeEntries: [{ id: 'te1', userId: 'u8', hours: 3.5, note: 'Responded to 14 reviews', at: iso(-1, 15) }] }),
  t(6, 'Coastline Cardiology — Homepage Build', 'Build homepage and service pages in Elementor from approved Figma.', 'in_progress', 'high', 'Development', 'c5', 'u6', 'u3', ['WordPress', 'API'], 6, { estHours: 40, projectId: 'p6', subtasks: subs(['Hosting + staging', true], ['Theme + plugins', true], ['Build pages', false], ['Mobile + speed check', false], ['Client approval', false]), timeEntries: [{ id: 'te2', userId: 'u6', hours: 12, note: 'Staging + theme setup', at: iso(-2, 17) }] }),
  t(7, 'WP Security & Plugin Updates — Apollo', 'Monthly maintenance run for apollo main site.', 'todo', 'medium', 'Development', 'c1', 'u7', 'u3', ['WordPress', 'Security'], 1, { estHours: 2, recurring: 'monthly', projectId: 'p2' }),
  t(8, 'Google Ads Setup — Northside Family Practice', 'New search campaign for family medicine services.', 'in_progress', 'urgent', 'Marketing', 'c6', 'u8', 'u4', ['Ads'], 0, { estHours: 8, projectId: 'p7', subtasks: subs(['Keyword research', true], ['Tracking', true], ['Ad copy', false], ['Launch', false]) }),
  t(9, 'Core Web Vitals — Manipal', 'LCP is 4.2s on mobile; target under 2.5s.', 'review', 'high', 'Development', 'c2', 'u7', 'u3', ['WordPress', 'Performance'], -2, { estHours: 5, reviewerId: 'u3', revision: { note: 'Hero image is still not preloaded — please recheck LCP on 4G.', by: 'u3', at: iso(-1, 11) } }),
  t(10, 'Patient portal login redesign', 'Hand-off screens for login, OTP and forgot password.', 'backlog', 'low', 'Creative', 'c1', undefined, 'u5', ['UI/UX'], 12, { projectId: 'p1' }),
  t(11, 'Landing page copy — Fortis health checks', 'Write conversion copy for 3 health-check packages.', 'todo', 'medium', 'Marketing', 'c4', 'u8', 'u4', ['Content'], 7, { projectId: 'p5' }),
  t(12, 'Brand refresh — logo exploration', 'Three directions for DM Healthcare wordmark.', 'in_progress', 'medium', 'Creative', 'c3', 'u5', 'u5', ['Branding'], 9, { projectId: 'p4', estHours: 12 }),
  t(13, 'Booking form bug on Coastline site', 'Form 3 stops submitting on Safari iOS.', 'support', 'critical', 'Development', 'c5', 'u7', 'u1', ['WordPress', 'API'], 0, { estHours: 3 }),
  t(14, 'Instagram reels batch — October', '12 short videos for Manipal.', 'todo', 'medium', 'Creative', 'c2', 'u9', 'u4', ['Marketing'], 10, { estHours: 18, projectId: 'p3' }),
  t(15, 'Citation clean-up (local SEO)', 'Fix NAP inconsistencies across 40 directories.', 'backlog', 'low', 'Marketing', 'c4', undefined, 'u4', ['SEO'], 15),
  t(16, 'Newsletter template — Northside', 'Mailchimp responsive template.', 'done', 'low', 'Creative', 'c6', 'u9', 'u5', ['Mobile'], -4, { completedAt: iso(-3, 14), estHours: 4 }),
  // cross-team requests sitting in the incoming queue
  t(17, 'Need 5 ad creatives for Google Ads launch', 'Marketing needs square + landscape creatives by Friday.', 'backlog', 'high', 'Creative', 'c6', undefined, 'u8', ['Figma', 'Ads'], 4, { incoming: true, estHours: 6 }),
  t(18, 'Add schema markup to service pages', 'Creative handed over final pages; dev to add MedicalBusiness schema.', 'backlog', 'medium', 'Development', 'c1', undefined, 'u4', ['SEO', 'WordPress'], 8, { incoming: true, estHours: 3 }),
];

const d = (offset: number, inH: number, outH: number, extraMin = 0): AttendanceDay => ({
  date: day(offset), clockIn: iso(offset, inH, 5 + extraMin), clockOut: iso(offset, outH, 12), breaks: [{ kind: 'Lunch', start: iso(offset, 13, 0), end: iso(offset, 13, 40) }],
});
export const attendance: Record<string, AttendanceDay[]> = {
  u1: [d(-1, 9, 18), d(-2, 9, 18, 10), d(-3, 10, 19), d(-4, 9, 17)],
};

export const claims: Claim[] = [
  { id: 'r1', userId: 'u1', title: 'Client visit — Chennai taxi', category: 'Travel', amount: 1850, date: day(-5), state: 'submitted' },
  { id: 'r2', userId: 'u8', title: 'Semrush monthly seat', category: 'Software', amount: 12400, date: day(-9), state: 'ceo_approved' },
  { id: 'r3', userId: 'u9', title: 'Wacom pen replacement', category: 'Equipment', amount: 5200, date: day(-14), state: 'paid' },
  { id: 'r4', userId: 'u6', title: 'Team lunch with client', category: 'Meals', amount: 2300, date: day(-2), state: 'draft' },
];

export const roleRequests: RoleRequest[] = [
  { id: 'rr1', userId: 'u6', from: 'member', to: 'team_lead', reason: 'Leading the WordPress build squad while Aravind is on leave.', status: 'pending' },
  { id: 'rr2', userId: 'u8', from: 'member', to: 'team_lead', reason: 'Taking over the Marketing intake queue.', status: 'pending' },
];
