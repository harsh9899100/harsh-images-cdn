"use client";

import { ProjectImage, Category } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

interface ProjectCardProps {
  project: string;
  category: Category;
  images: ProjectImage[];
  onImageClick: (img: ProjectImage) => void;
  onUpload: (category: Category, project: string) => void;
}

export default function ProjectCard({
  project,
  category,
  images,
  onImageClick,
  onUpload,
}: ProjectCardProps) {
  const displayName = project
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const totalSize = images.reduce((s, i) => s + i.size, 0);
  const preview = images.slice(0, 4);

  return (
    <div className="group bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 transition-all duration-300">
      {/* Preview grid */}
      <div className="relative aspect-[4/3] bg-black/30 overflow-hidden">
        {preview.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-white/15">
            <div className="text-center">
              <div className="text-4xl mb-2">📂</div>
              <p className="text-xs">No images yet</p>
            </div>
          </div>
        ) : preview.length === 1 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview[0].url}
            alt={preview[0].fileName}
            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
            onClick={() => onImageClick(preview[0])}
          />
        ) : (
          <div
            className={`absolute inset-0 grid gap-0.5 ${
              preview.length === 2
                ? "grid-cols-2"
                : preview.length === 3
                ? "grid-cols-2 grid-rows-2"
                : "grid-cols-2 grid-rows-2"
            }`}
          >
            {preview.map((img, i) => (
              <div
                key={img.url}
                className={`relative overflow-hidden cursor-pointer ${
                  preview.length === 3 && i === 0 ? "row-span-2" : ""
                }`}
                onClick={() => onImageClick(img)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.fileName}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
                {i === 3 && images.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      +{images.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white/60 border border-white/10">
            {category === "real-estate" ? "🏠 Real Estate" : "🎨 Portfolio"}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-white font-semibold text-sm leading-tight">
              {displayName}
            </h3>
            <p className="text-white/35 text-xs mt-1">
              {images.length} image{images.length !== 1 ? "s" : ""} ·{" "}
              {formatBytes(totalSize)}
            </p>
          </div>
          <button
            onClick={() => onUpload(category, project)}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg bg-[#e8c97e]/10 hover:bg-[#e8c97e]/20 text-[#e8c97e] font-medium transition-all opacity-0 group-hover:opacity-100"
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}
