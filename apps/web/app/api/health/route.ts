import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export function GET() { return NextResponse.json({ status: "starter", productionReady: false, liveConnections: false }, { headers: { "Cache-Control": "no-store" } }); }
