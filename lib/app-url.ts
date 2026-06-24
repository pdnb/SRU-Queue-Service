export function getTicketUrl(ticketId: string, origin?: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? origin ?? "";
  return `${base.replace(/\/$/, "")}/ticket/${ticketId}`;
}
