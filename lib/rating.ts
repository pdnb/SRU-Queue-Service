import { TicketStatus } from "@/app/generated/prisma/enums";

export const RATING_WINDOW_MS = 24 * 60 * 60 * 1000;

export const MIN_RATING = 1;
export const MAX_RATING = 5;

type RateableTicket = {
  status: TicketStatus;
  completedAt: Date | null;
  rating: number | null;
};

export function isWithinRatingWindow(ticket: RateableTicket, now = new Date()): boolean {
  if (ticket.status !== TicketStatus.COMPLETED || !ticket.completedAt) {
    return false;
  }

  return now.getTime() < ticket.completedAt.getTime() + RATING_WINDOW_MS;
}

export function canSubmitRating(ticket: RateableTicket, now = new Date()): boolean {
  return ticket.rating === null && isWithinRatingWindow(ticket, now);
}

export function computeAvgRating(ratings: Array<number | null>): number {
  const values = ratings.filter((r): r is number => r !== null);
  if (values.length === 0) return 0;
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

export function computeResponseRate(ratedCount: number, completedCount: number): number {
  if (completedCount === 0) return 0;
  return Math.round((ratedCount / completedCount) * 100);
}
