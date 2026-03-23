-- AlterTable: add team-level booking guardrail floors
-- minimumBookingNotice: minimum notice (minutes) required before a booking; acts as a floor over event-type value.
-- afterEventBuffer:     buffer (minutes) blocked after each booking; acts as a floor over event-type value.
-- Both are nullable: NULL means "no team-level policy" (event-type value is used as-is).
ALTER TABLE "Team" ADD COLUMN "minimumBookingNotice" INTEGER;
ALTER TABLE "Team" ADD COLUMN "afterEventBuffer" INTEGER;
