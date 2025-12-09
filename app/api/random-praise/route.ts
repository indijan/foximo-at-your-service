import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase
    .from("compliments")
    .select("*");

  if (error) {
    return NextResponse.json(
      { error: "Could not load compliments." },
      { status: 500 }
    );
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: "No compliments available." },
      { status: 404 }
    );
  }

  const random = data[Math.floor(Math.random() * data.length)];

  return NextResponse.json({ praise: random });
}