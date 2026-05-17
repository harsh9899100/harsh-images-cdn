import { copy, del, list } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { parseBlobPathname } from "@/lib/utils";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const { oldCategory, oldProject, newProject } = await request.json();

    if (!oldCategory || !oldProject || !newProject) {
      return NextResponse.json(
        { error: "Missing oldCategory, oldProject, or newProject" },
        { status: 400 }
      );
    }

    const sanitizedNewProject = newProject.trim().toLowerCase().replace(/\s+/g, "-");
    if (!sanitizedNewProject) {
      return NextResponse.json({ error: "Invalid new project name" }, { status: 400 });
    }

    // List all blobs
    const { blobs } = await list();

    // Filter blobs that belong to the old project folder
    const prefix = `${oldCategory}/${oldProject}/`;
    const targetBlobs = blobs.filter((blob) => blob.pathname.startsWith(prefix));

    if (targetBlobs.length === 0) {
      return NextResponse.json({ error: "No assets found in the specified project" }, { status: 404 });
    }

    // Process renames sequentially to avoid rate limits
    for (const blob of targetBlobs) {
      const parsed = parseBlobPathname(blob.pathname);
      if (!parsed) continue;

      const newPathname = `${oldCategory}/${sanitizedNewProject}/${parsed.fileName}`;
      
      // Copy to new path
      await copy(blob.url, newPathname, { access: "public" });
      
      // Delete old url
      await del(blob.url);
    }

    return NextResponse.json({ success: true, newProjectSlug: sanitizedNewProject });
  } catch (error) {
    console.error("Rename project error:", error);
    return NextResponse.json({ error: "Rename failed" }, { status: 500 });
  }
}
