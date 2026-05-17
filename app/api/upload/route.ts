import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { buildBlobPath } from "@/lib/utils";
import { Category } from "@/lib/types";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const project = formData.get("project") as string | null;
    const category = formData.get("category") as Category | null;

    if (!file || !project || !category) {
      return NextResponse.json(
        { error: "Missing file, project, or category" },
        { status: 400 }
      );
    }

    if (typeof category !== "string" || !category.trim()) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only image files are allowed (JPEG, PNG, WebP, GIF, AVIF)" },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be under 10MB" },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${timestamp}_${safeName}`;
    const pathname = buildBlobPath(category, project, fileName);

    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      project: project.trim().toLowerCase().replace(/\s+/g, "-"),
      category,
      fileName,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
