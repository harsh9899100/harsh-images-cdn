import { Category, ProjectImage } from "./types";

export function buildBlobPath(
  category: Category,
  project: string,
  fileName: string
): string {
  const sanitizedProject = project.trim().toLowerCase().replace(/\s+/g, "-");
  return `${category}/${sanitizedProject}/${fileName}`;
}

export function parseBlobPathname(pathname: string): {
  category: Category;
  project: string;
  fileName: string;
} | null {
  const parts = pathname.split("/");
  if (parts.length < 3) return null;
  const [category, project, ...rest] = parts;
  if (category !== "real-estate" && category !== "portfolio") return null;
  return {
    category: category as Category,
    project,
    fileName: rest.join("/"),
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function groupImagesByProject(
  images: ProjectImage[]
): Record<string, ProjectImage[]> {
  return images.reduce(
    (acc, img) => {
      const key = `${img.category}/${img.project}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(img);
      return acc;
    },
    {} as Record<string, ProjectImage[]>
  );
}

export const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: "real-estate", label: "Real Estate", icon: "🏠" },
  { value: "portfolio", label: "Portfolio", icon: "🎨" },
];
