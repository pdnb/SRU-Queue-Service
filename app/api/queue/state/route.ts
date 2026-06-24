import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { getQueueState } from "@/lib/queue-service";

export async function GET() {
  try {
    const state = await getQueueState();
    return NextResponse.json(state);
  } catch (error) {
    return apiError(error);
  }
}
