import { Category, ProjectImage } from "./types";

export function buildBlobPath(
  category: Category,
  project: string,
  fileName: string
): string {
  const sanitizedProject = project.trim().toLowerCase().replace(/\s+/g, "-");
  const sanitizedCategory = category.trim().toLowerCase().replace(/\s+/g, "-");
  return `${sanitizedCategory}/${sanitizedProject}/${fileName}`;
}

export function parseBlobPathname(pathname: string): {
  category: Category;
  project: string;
  fileName: string;
} | null {
  const parts = pathname.split("/");
  if (parts.length < 3) return null;
  const [category, project, ...rest] = parts;
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

export const DEFAULT_CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: "real-estate", label: "Real Estate", icon: "🏠" },
  { value: "portfolio", label: "Portfolio", icon: "🎨" },
];

export function getCategoryDetails(
  value: string,
  customCategories?: Record<string, { label: string; icon: string }>
): { label: string; icon: string } {
  const foundDefault = DEFAULT_CATEGORIES.find((c) => c.value === value);
  if (foundDefault) return foundDefault;

  if (customCategories && customCategories[value]) {
    return customCategories[value];
  }

  // Fallback formatter
  const formattedLabel = value
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return {
    label: formattedLabel,
    icon: "📂",
  };
}

