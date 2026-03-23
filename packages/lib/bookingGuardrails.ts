/**
 * Booking guardrails: minimum booking notice and after-event buffer.
 *
 * Precedence rule (applies in both slot-generation and booking-validation):
 *   effectiveValue = Math.max(teamSetting ?? 0, eventTypeSetting)
 *
 * This means team settings act as an *organisational floor* — event types can
 * be more restrictive (higher value) but cannot go below the team minimum.
 * Teams that have not configured a value (null / undefined) impose no floor.
 */

export type TeamGuardrails = {
  minimumBookingNotice?: number | null;
  afterEventBuffer?: number | null;
};

export type EventTypeGuardrails = {
  minimumBookingNotice: number;
  afterEventBuffer: number;
};

export function getEffectiveMinimumBookingNotice(
  eventTypeMinNotice: number,
  team: TeamGuardrails | null | undefined
): number {
  return Math.max(team?.minimumBookingNotice ?? 0, eventTypeMinNotice);
}

export function getEffectiveAfterEventBuffer(
  eventTypeAfterBuffer: number,
  team: TeamGuardrails | null | undefined
): number {
  return Math.max(team?.afterEventBuffer ?? 0, eventTypeAfterBuffer);
}

/**
 * Returns effective guardrail values for a given event type, applying the team
 * floor where applicable.
 */
export function getEffectiveBookingGuardrails(
  eventType: EventTypeGuardrails,
  team: TeamGuardrails | null | undefined
): EventTypeGuardrails {
  return {
    minimumBookingNotice: getEffectiveMinimumBookingNotice(eventType.minimumBookingNotice, team),
    afterEventBuffer: getEffectiveAfterEventBuffer(eventType.afterEventBuffer, team),
  };
}
