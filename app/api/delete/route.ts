import { del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function DELETE(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }
    await del(url);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
