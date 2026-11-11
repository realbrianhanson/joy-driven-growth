-- Turn the text campaign scheduler off until text campaigns are set up.
--
-- Text campaigns need Twilio secrets, and none are set. Two scheduled jobs
-- still ran every minute, around the clock, since May 2026. Each run writes a
-- history row, and steady background work keeps a small database busy. On
-- 10 November 2026 this Tiny instance ran out of disk IO budget and stopped
-- answering.
--
-- To turn the scheduler back on, follow "Turn on text campaigns" in the README.

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN ('drain-campaign-jobs', 'promote-scheduled-campaigns');

-- Clear the run history those jobs left behind. TRUNCATE is cheap. Fall back
-- to DELETE when this role may not truncate the table.
DO $$
BEGIN
  BEGIN
    TRUNCATE cron.job_run_details;
  EXCEPTION WHEN insufficient_privilege THEN
    DELETE FROM cron.job_run_details;
  END;
END $$;
