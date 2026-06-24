import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { getActiveServices } from "@/lib/queue-service";

export async function GET() {
  try {
    const services = await getActiveServices();
    return NextResponse.json({ services });
  } catch (error) {
    return apiError(error);
  }
}
