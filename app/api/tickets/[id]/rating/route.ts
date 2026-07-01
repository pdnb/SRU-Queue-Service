import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { submitTicketRating } from "@/lib/queue-service";
import { submitRatingSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = submitRatingSchema.parse(body);
    const result = await submitTicketRating(id, data.rating);
    return NextResponse.json({ rating: result });
  } catch (error) {
    return apiError(error);
  }
}
