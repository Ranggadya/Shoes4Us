import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ buckets: data });
}
