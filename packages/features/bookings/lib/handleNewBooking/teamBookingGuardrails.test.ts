import { describe, it, expect } from "vitest";

import { getEffectiveMinimumBookingNotice } from "./validateBookingTimeIsNotOutOfBounds";

/**
 * Unit tests for team-level booking guardrail precedence logic.
 *
 * Rules:
 *   effectiveMinimumBookingNotice = max(eventType.minimumBookingNotice, team.minimumBookingNotice ?? 0)
 *   effectiveAfterEventBuffer     = max(eventType.afterEventBuffer, team.afterEventBuffer ?? 0)
 *
 * "Team floor" means the team value acts as a minimum; individual event types can be equal or
 * more restrictive (larger value), but never less than the team setting.
 */
describe("getEffectiveMinimumBookingNotice", () => {
  it("returns event-type value when no team policy is set (null)", () => {
    expect(getEffectiveMinimumBookingNotice(120, null)).toBe(120);
  });

  it("returns event-type value when no team policy is set (undefined)", () => {
    expect(getEffectiveMinimumBookingNotice(120, undefined)).toBe(120);
  });

  it("returns team value when it is higher than event-type value", () => {
    // Team sets 4-hour floor, event-type only requires 2 hours → enforce 4 hours
    expect(getEffectiveMinimumBookingNotice(120, 240)).toBe(240);
  });

  it("returns event-type value when it is higher than team value", () => {
    // Event-type is more restrictive than team floor → keep event-type value
    expect(getEffectiveMinimumBookingNotice(480, 60)).toBe(480);
  });

  it("returns the shared value when event-type and team values are equal", () => {
    expect(getEffectiveMinimumBookingNotice(120, 120)).toBe(120);
  });

  it("returns zero when both event-type and team are zero", () => {
    expect(getEffectiveMinimumBookingNotice(0, 0)).toBe(0);
  });

  it("returns event-type value when team floor is 0 (disabled)", () => {
    expect(getEffectiveMinimumBookingNotice(60, 0)).toBe(60);
  });

  it("returns team value when event-type value is 0 and team has a floor", () => {
    // Hypothetical: event has 0 notice but team requires 30 min
    expect(getEffectiveMinimumBookingNotice(0, 30)).toBe(30);
  });
});

/**
 * Inline tests for the afterEventBuffer floor logic (uses the same Math.max pattern,
 * exercised here without needing a separate exported helper).
 */
describe("effectiveAfterEventBuffer (Math.max pattern)", () => {
  function effectiveAfterEventBuffer(
    eventTypeBuffer: number,
    teamBuffer: number | null | undefined
  ): number {
    return Math.max(eventTypeBuffer ?? 0, teamBuffer ?? 0);
  }

  it("returns event-type buffer when no team buffer is set", () => {
    expect(effectiveAfterEventBuffer(15, null)).toBe(15);
  });

  it("returns team buffer when it is larger than event-type buffer", () => {
    expect(effectiveAfterEventBuffer(5, 30)).toBe(30);
  });

  it("returns event-type buffer when it is larger than team buffer", () => {
    expect(effectiveAfterEventBuffer(60, 15)).toBe(60);
  });

  it("returns zero when both are zero", () => {
    expect(effectiveAfterEventBuffer(0, 0)).toBe(0);
  });

  it("returns team buffer when event buffer is 0 and team buffer is set", () => {
    expect(effectiveAfterEventBuffer(0, 20)).toBe(20);
  });
});
