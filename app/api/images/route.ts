import { list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { parseBlobPathname } from "@/lib/utils";
import { ProjectImage } from "@/lib/types";

export const runtime = "edge";

export async function GET() {
  try {
    const { blobs } = await list();

    const images: ProjectImage[] = blobs
      .map((blob) => {
        const parsed = parseBlobPathname(blob.pathname);
        if (!parsed) return null;
        return {
          url: blob.url,
          pathname: blob.pathname,
          size: blob.size,
          uploadedAt: blob.uploadedAt.toISOString(),
          project: parsed.project,
          category: parsed.category,
          fileName: parsed.fileName,
        } satisfies ProjectImage;
      })
      .filter((img): img is ProjectImage => img !== null);

    return NextResponse.json({ images });
  } catch (error) {
    console.error("List blobs error:", error);
    return NextResponse.json(
      { error: "Failed to list images" },
      { status: 500 }
    );
  }
}
