import { describe, expect, it } from "vitest";

import {
  getEffectiveMinimumBookingNotice,
  getEffectiveAfterEventBuffer,
  getEffectiveBookingGuardrails,
} from "./bookingGuardrails";

describe("getEffectiveMinimumBookingNotice", () => {
  it("returns the event-type value when no team setting exists", () => {
    expect(getEffectiveMinimumBookingNotice(120, null)).toBe(120);
    expect(getEffectiveMinimumBookingNotice(120, undefined)).toBe(120);
    expect(getEffectiveMinimumBookingNotice(120, { minimumBookingNotice: null })).toBe(120);
    expect(getEffectiveMinimumBookingNotice(120, { minimumBookingNotice: undefined })).toBe(120);
  });

  it("returns the event-type value when it is higher than the team floor", () => {
    expect(getEffectiveMinimumBookingNotice(240, { minimumBookingNotice: 120 })).toBe(240);
  });

  it("returns the team floor when it is higher than the event-type value", () => {
    // Team admin requires at least 4 hours; event type only requires 2 hours → use team value
    expect(getEffectiveMinimumBookingNotice(120, { minimumBookingNotice: 240 })).toBe(240);
  });

  it("returns the event-type value when both are equal", () => {
    expect(getEffectiveMinimumBookingNotice(120, { minimumBookingNotice: 120 })).toBe(120);
  });

  it("treats a team value of 0 as no floor (identity)", () => {
    expect(getEffectiveMinimumBookingNotice(60, { minimumBookingNotice: 0 })).toBe(60);
  });
});

describe("getEffectiveAfterEventBuffer", () => {
  it("returns the event-type value when no team setting exists", () => {
    expect(getEffectiveAfterEventBuffer(30, null)).toBe(30);
    expect(getEffectiveAfterEventBuffer(30, { afterEventBuffer: null })).toBe(30);
  });

  it("returns the event-type value when it is higher than the team floor", () => {
    expect(getEffectiveAfterEventBuffer(60, { afterEventBuffer: 30 })).toBe(60);
  });

  it("returns the team floor when it is higher than the event-type value", () => {
    expect(getEffectiveAfterEventBuffer(0, { afterEventBuffer: 30 })).toBe(30);
  });

  it("treats a team value of 0 as no floor (identity)", () => {
    expect(getEffectiveAfterEventBuffer(15, { afterEventBuffer: 0 })).toBe(15);
  });
});

describe("getEffectiveBookingGuardrails", () => {
  it("applies floors for both fields simultaneously", () => {
    const result = getEffectiveBookingGuardrails(
      { minimumBookingNotice: 60, afterEventBuffer: 10 },
      { minimumBookingNotice: 120, afterEventBuffer: 30 }
    );
    expect(result.minimumBookingNotice).toBe(120);
    expect(result.afterEventBuffer).toBe(30);
  });

  it("only raises the field that is below the team floor", () => {
    const result = getEffectiveBookingGuardrails(
      { minimumBookingNotice: 240, afterEventBuffer: 5 },
      { minimumBookingNotice: 120, afterEventBuffer: 30 }
    );
    // Event-type min notice (240) > team floor (120) → keep 240
    expect(result.minimumBookingNotice).toBe(240);
    // Event-type buffer (5) < team floor (30) → raise to 30
    expect(result.afterEventBuffer).toBe(30);
  });

  it("returns event-type values unchanged when team has no guardrails configured", () => {
    const result = getEffectiveBookingGuardrails(
      { minimumBookingNotice: 60, afterEventBuffer: 15 },
      null
    );
    expect(result.minimumBookingNotice).toBe(60);
    expect(result.afterEventBuffer).toBe(15);
  });
});
