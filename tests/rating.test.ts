import { describe, expect, it } from "vitest";
import { TicketStatus } from "@/app/generated/prisma/enums";
import {
  RATING_WINDOW_MS,
  canSubmitRating,
  computeAvgRating,
  computeResponseRate,
  isWithinRatingWindow,
} from "@/lib/rating";

describe("rating helpers", () => {
  const completedAt = new Date("2026-07-01T10:00:00");

  const baseTicket = {
    status: TicketStatus.COMPLETED,
    completedAt,
    rating: null as number | null,
  };

  it("allows rating within 24 hours of completion", () => {
    const now = new Date(completedAt.getTime() + RATING_WINDOW_MS - 1);
    expect(isWithinRatingWindow(baseTicket, now)).toBe(true);
    expect(canSubmitRating(baseTicket, now)).toBe(true);
  });

  it("blocks rating after 24 hours", () => {
    const now = new Date(completedAt.getTime() + RATING_WINDOW_MS);
    expect(isWithinRatingWindow(baseTicket, now)).toBe(false);
    expect(canSubmitRating(baseTicket, now)).toBe(false);
  });

  it("blocks rating when already rated", () => {
    const now = new Date(completedAt.getTime() + 1_000);
    expect(canSubmitRating({ ...baseTicket, rating: 5 }, now)).toBe(false);
  });

  it("computes average rating", () => {
    expect(computeAvgRating([5, 4, null])).toBe(4.5);
    expect(computeAvgRating([null, null])).toBe(0);
  });

  it("computes response rate", () => {
    expect(computeResponseRate(3, 10)).toBe(30);
    expect(computeResponseRate(0, 0)).toBe(0);
  });
});
