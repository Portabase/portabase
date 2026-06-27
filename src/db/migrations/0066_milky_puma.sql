-- Custom SQL migration file, put your code below! --
UPDATE settings SET onboarding = true
WHERE onboarding = false
  AND (
    EXISTS (SELECT 1 FROM organization WHERE slug <> 'default')
        OR EXISTS (SELECT 1 FROM agents)
        OR EXISTS (SELECT 1 FROM projects)
        OR EXISTS (SELECT 1 FROM databases)
        OR EXISTS (SELECT 1 FROM notification_channel)
        OR EXISTS (SELECT 1 FROM storage_channel WHERE provider <> 'local')
    );