-- Starter task types + checklists for a WordPress / digital marketing agency

INSERT INTO task_types (category, name, default_estimate_hours) VALUES
  ('wordpress', 'New site build',         40),
  ('wordpress', 'Monthly maintenance',     2),
  ('wordpress', 'Speed optimisation',      4),
  ('wordpress', 'Malware cleanup',         4),
  ('seo',       'Technical SEO audit',     6),
  ('seo',       'Keyword research',        4),
  ('seo',       'Monthly SEO report',      2),
  ('ads',       'Campaign setup',          6),
  ('ads',       'Weekly ad optimisation',  2),
  ('social',    'Monthly content calendar',4),
  ('social',    'Post design + caption',   1),
  ('content',   'Blog article',            3);

WITH t AS (SELECT id, name FROM task_types)
INSERT INTO task_type_checklist_items (task_type_id, position, label)
SELECT t.id, v.position, v.label FROM t JOIN (VALUES
  ('New site build', 1, 'Collect brand assets and content'),
  ('New site build', 2, 'Set up hosting + staging'),
  ('New site build', 3, 'Install theme and plugins'),
  ('New site build', 4, 'Build pages'),
  ('New site build', 5, 'Mobile + speed check'),
  ('New site build', 6, 'Internal review'),
  ('New site build', 7, 'Client approval'),
  ('New site build', 8, 'Go live + DNS'),
  ('Monthly maintenance', 1, 'Backup site'),
  ('Monthly maintenance', 2, 'Update WP core, themes, plugins'),
  ('Monthly maintenance', 3, 'Check forms, uptime, broken links'),
  ('Monthly maintenance', 4, 'Security scan'),
  ('Monthly SEO report', 1, 'Pull Search Console + Analytics data'),
  ('Monthly SEO report', 2, 'Rank tracking snapshot'),
  ('Monthly SEO report', 3, 'Write summary + next-month plan'),
  ('Monthly SEO report', 4, 'Send to client'),
  ('Post design + caption', 1, 'Design creative'),
  ('Post design + caption', 2, 'Write caption + hashtags'),
  ('Post design + caption', 3, 'Client approval'),
  ('Post design + caption', 4, 'Schedule / publish')
) AS v(type_name, position, label) ON v.type_name = t.name;
