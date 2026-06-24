import { describe, expect, it } from "vitest";
import { formatDisplayNo, getQueueDate, isSameQueueDate } from "@/lib/date";

describe("date helpers", () => {
  it("formats display numbers with prefix", () => {
    expect(formatDisplayNo("A", 1)).toBe("A001");
    expect(formatDisplayNo("B", 42)).toBe("B042");
  });

  it("normalizes queue date to midnight", () => {
    const date = getQueueDate(new Date("2026-06-24T15:30:00"));
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
    expect(date.getDate()).toBe(24);
  });

  it("compares queue dates by calendar day", () => {
    const morning = new Date("2026-06-24T09:00:00");
    const evening = new Date("2026-06-24T20:00:00");
    const nextDay = new Date("2026-06-25T09:00:00");

    expect(isSameQueueDate(morning, evening)).toBe(true);
    expect(isSameQueueDate(morning, nextDay)).toBe(false);
  });
});
