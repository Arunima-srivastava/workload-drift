import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("workload_snapshots")
    .select("*")
    .eq("user_email", session.user.email)
    .order("created_at", { ascending: true })
    .limit(20);

  if (error) {
    return NextResponse.json({ error });
  }

  return NextResponse.json(data);
}