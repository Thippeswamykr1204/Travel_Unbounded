import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { analyticsQuerySchema } from "@/lib/validations";
import { getAnalyticsSummary } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = analyticsQuerySchema.safeParse({
      months: searchParams.get("months") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid months parameter.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    await connectDB();
    const data = await getAnalyticsSummary(parsed.data.months);

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}