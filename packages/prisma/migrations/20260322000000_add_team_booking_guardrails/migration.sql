-- AlterTable
-- Adds team-level booking guardrails: minimumBookingNotice and afterEventBuffer.
-- Both are nullable (no column default at DB level) so existing rows remain NULL,
-- which the application treats as "no team-level floor".  Existing behaviour is
-- therefore fully backwards-compatible: teams that never set these values will
-- continue to use only the event-type settings.
ALTER TABLE "Team" ADD COLUMN "minimumBookingNotice" INTEGER;
ALTER TABLE "Team" ADD COLUMN "afterEventBuffer" INTEGER;
