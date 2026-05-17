"use client";

import { ProjectImage, Category } from "@/lib/types";
import { formatBytes, getCategoryDetails } from "@/lib/utils";

interface ProjectCardProps {
  project: string;
  category: Category;
  images: ProjectImage[];
  onViewDetails: () => void;
  onUpload: (category: Category, project: string) => void;
  customCategories?: Record<string, { label: string; icon: string }>;
}

export default function ProjectCard({
  project,
  category,
  images,
  onViewDetails,
  onUpload,
  customCategories,
}: ProjectCardProps) {
  const displayName = project
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const totalSize = images.reduce((s, i) => s + i.size, 0);
  const preview = images.slice(0, 4);

  // Get last updated timestamp
  const latestUpload = images.reduce((latest, current) => {
    return new Date(current.uploadedAt) > new Date(latest)
      ? current.uploadedAt
      : latest;
  }, images[0]?.uploadedAt || "");

  return (
    <div
      onClick={onViewDetails}
      className="group bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden hover:border-[#e8c97e]/30 hover:bg-white/[0.04] transition-all duration-300 flex flex-col cursor-pointer shadow-xl"
    >
      {/* Preview grid */}
      <div className="relative aspect-[4/3] bg-black/40 overflow-hidden border-b border-white/5">
        {preview.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-white/10">
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
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
        ) : (
          <div
            className={`absolute inset-0 grid gap-0.5 ${
              preview.length === 2
                ? "grid-cols-2"
                : "grid-cols-2 grid-rows-2"
            }`}
          >
            {preview.map((img, i) => (
              <div
                key={img.url}
                className={`relative overflow-hidden ${
                  preview.length === 3 && i === 0 ? "row-span-2" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.fileName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                {i === 3 && images.length > 4 && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="text-white font-extrabold text-sm tracking-wider">
                      +{images.length - 4} MORE
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="text-[9px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white/70 border border-white/5 shadow-md">
            {getCategoryDetails(category, customCategories).icon} {getCategoryDetails(category, customCategories).label}
          </span>
        </div>

        {/* Hover overlay with a sleek folder open hint */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-[1px]">
          <span className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold shadow-2xl scale-95 group-hover:scale-100 transition-all duration-300">
            Open Folder 📂
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-white font-bold text-sm tracking-tight truncate leading-snug group-hover:text-[#e8c97e] transition-colors">
            {displayName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-white/40 text-xs font-semibold">
              {images.length} image{images.length !== 1 ? "s" : ""}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/10" />
            <span className="text-white/40 text-xs font-semibold">
              {formatBytes(totalSize)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 mt-3 pt-3">
          <span className="text-[10px] text-white/20 font-medium truncate max-w-[120px]">
            {latestUpload ? `Updated ${new Date(latestUpload).toLocaleDateString()}` : "No uploads"}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpload(category, project);
            }}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-[#e8c97e]/10 hover:bg-[#e8c97e]/20 text-[#e8c97e] font-semibold border border-[#e8c97e]/20 transition-all"
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}
