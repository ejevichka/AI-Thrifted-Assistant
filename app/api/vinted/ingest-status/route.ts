import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// This is a GET request, so we can cache the result for a short period.
export const revalidate = 60; // Revalidate every 60 seconds

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // Perform a highly efficient query to just count the rows.
    // 'head: true' ensures we only get the count, not the data itself.
    const { count, error } = await supabase
      .from("vinted_documents")
      .select("id", { count: "exact", head: true });

    if (error) {
      throw error;
    }

    const isIngested = count !== null && count > 0;

    return NextResponse.json({ isIngested });

  } catch (error: any) {
    console.error("Error checking ingestion status:", error);
    return NextResponse.json(
      { error: "Failed to check ingestion status.", isIngested: false },
      { status: 500 }
    );
  }
}