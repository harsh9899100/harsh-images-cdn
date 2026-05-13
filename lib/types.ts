export type Category = "real-estate" | "portfolio";

export interface ProjectImage {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
  project: string;
  category: Category;
  fileName: string;
}

export interface Project {
  name: string;
  category: Category;
  images: ProjectImage[];
}

export interface BlobMetadata {
  project: string;
  category: Category;
  fileName: string;
  uploadedAt: string;
}
