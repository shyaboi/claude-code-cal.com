/**
 * Unit tests for team-level booking guardrail precedence in
 * validateBookingTimeIsNotOutOfBounds.
 *
 * The precedence rule:
 *   effectiveMinNotice = Math.max(team.minimumBookingNotice ?? 0, eventType.minimumBookingNotice)
 *
 * These tests verify that a booking that would be ALLOWED by the event-type
 * minimumBookingNotice alone can be REJECTED when the team floor is higher,
 * and that the event-type value is respected when it is already >= the floor.
 */
import { describe, expect, it, vi } from "vitest";

import type { Logger } from "tslog";
import { HttpError } from "@calcom/lib/http-error";
import { validateBookingTimeIsNotOutOfBounds } from "./validateBookingTimeIsNotOutOfBounds";
import { PeriodType } from "@calcom/prisma/enums";

// Minimal logger stub
const logger = {
  warn: vi.fn(),
  info: vi.fn(),
} as unknown as Logger<unknown>;

// A start time well in the future so period-range checks always pass
const FUTURE_START = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(); // +10 days

// Event type base (minimumBookingNotice = 0 → always in-bounds for notice checks)
const baseEventType = {
  periodType: PeriodType.UNLIMITED,
  periodDays: null,
  periodEndDate: null,
  periodStartDate: null,
  periodCountCalendarDays: null,
  eventName: "Test Event",
  id: 1,
  title: "Test Event",
};

describe("validateBookingTimeIsNotOutOfBounds — team-floor precedence", () => {
  it("allows a booking when no team floor is set and event-type notice is satisfied", async () => {
    const eventType = {
      ...baseEventType,
      minimumBookingNotice: 0,
      team: null,
    };

    // Should not throw — booking is far in the future, notice = 0
    await expect(
      validateBookingTimeIsNotOutOfBounds(FUTURE_START, "UTC", eventType, undefined, logger)
    ).resolves.not.toThrow();
  });

  it("allows a booking that satisfies both event-type notice and team floor", async () => {
    const eventType = {
      ...baseEventType,
      minimumBookingNotice: 60, // 1 hour
      team: { minimumBookingNotice: 120 }, // 2-hour team floor
    };

    // Booking 10 days in the future satisfies a 2-hour notice → should pass
    await expect(
      validateBookingTimeIsNotOutOfBounds(FUTURE_START, "UTC", eventType, undefined, logger)
    ).resolves.not.toThrow();
  });

  it("rejects a booking that violates the team floor even though the event-type notice is satisfied", async () => {
    // Book 5 minutes from now — satisfies event-type notice of 0 but not a 1-hour team floor
    const soonStart = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const eventType = {
      ...baseEventType,
      minimumBookingNotice: 0, // event type: no notice required
      team: { minimumBookingNotice: 60 }, // team floor: 60 minutes
    };

    await expect(
      validateBookingTimeIsNotOutOfBounds(soonStart, "UTC", eventType, undefined, logger)
    ).rejects.toThrow(HttpError);
  });

  it("rejects a booking that violates the event-type notice (event-type wins when higher than floor)", async () => {
    // Book 5 minutes from now — violates even a 30-min event-type notice
    const soonStart = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const eventType = {
      ...baseEventType,
      minimumBookingNotice: 30, // event type: 30-minute notice (higher than team floor)
      team: { minimumBookingNotice: 10 }, // team floor: only 10 minutes
    };

    // Effective notice = max(10, 30) = 30 minutes → booking 5 min ahead is rejected
    await expect(
      validateBookingTimeIsNotOutOfBounds(soonStart, "UTC", eventType, undefined, logger)
    ).rejects.toThrow(HttpError);
  });

  it("allows the booking when team floor is zero and event-type notice is met", async () => {
    const soonStart = new Date(Date.now() + 90 * 60 * 1000).toISOString(); // 90 min from now

    const eventType = {
      ...baseEventType,
      minimumBookingNotice: 60, // 60-minute notice
      team: { minimumBookingNotice: 0 }, // team floor: 0 (no restriction)
    };

    // 90 min ahead satisfies the 60-min event-type notice → allowed
    await expect(
      validateBookingTimeIsNotOutOfBounds(soonStart, "UTC", eventType, undefined, logger)
    ).resolves.not.toThrow();
  });
});
