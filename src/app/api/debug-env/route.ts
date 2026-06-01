import { NextResponse } from "next/server";

export async function GET() {
  const pk = process.env.FIREBASE_PRIVATE_KEY ?? "UNDEFINED";
  return NextResponse.json({
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    pk_length: pk.length,
    pk_start: pk.substring(0, 40),
    pk_has_newlines: pk.includes("\n"),
    pk_has_literal_slash_n: pk.includes("\\n"),
  });
}
