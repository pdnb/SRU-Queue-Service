import { describe, expect, it } from "vitest";
import {
  buildDisplayAnnouncementText,
  buildTicketAnnouncementText,
  speakDisplayNo,
} from "@/lib/queue-announcement";

describe("speakDisplayNo", () => {
  it("reads prefix and digits separately in Thai", () => {
    expect(speakDisplayNo("A001")).toBe("เอ ศูนย์ ศูนย์ หนึ่ง");
    expect(speakDisplayNo("B042")).toBe("บี ศูนย์ สี่ สอง");
  });

  it("handles lowercase prefix", () => {
    expect(speakDisplayNo("a010")).toBe("เอ ศูนย์ หนึ่ง ศูนย์");
  });
});

describe("announcement text", () => {
  it("builds display announcement", () => {
    expect(buildDisplayAnnouncementText("A001", "เคาน์เตอร์ 1")).toBe(
      "เชิญหมายเลข เอ ศูนย์ ศูนย์ หนึ่ง ที่ เคาน์เตอร์ 1",
    );
  });

  it("builds ticket announcement", () => {
    expect(buildTicketAnnouncementText("A001", "เคาน์เตอร์ 1")).toBe(
      "คิวของคุณ เอ ศูนย์ ศูนย์ หนึ่ง กรุณาไปที่ เคาน์เตอร์ 1",
    );
  });
});
