"use client";

import { useEffect } from "react";
import { ProjectImage } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

interface LightboxProps {
  image: ProjectImage;
  onClose: () => void;
  onDelete: (url: string) => void;
}

export default function Lightbox({ image, onClose, onDelete }: LightboxProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleDelete = async () => {
    if (!confirm("Delete this image permanently?")) return;
    onDelete(image.url);
  };

  const cdnUrl = image.url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative z-10 flex flex-col max-w-5xl w-full max-h-[90vh]">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white font-medium text-sm">{image.fileName}</p>
            <p className="text-white/40 text-xs mt-0.5">
              {formatBytes(image.size)} ·{" "}
              {new Date(image.uploadedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={cdnUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs font-medium transition-all"
            >
              Open URL ↗
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(cdnUrl);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#e8c97e]/20 hover:bg-[#e8c97e]/30 text-[#e8c97e] text-xs font-medium transition-all"
            >
              Copy CDN URL
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium transition-all"
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className="ml-2 text-white/40 hover:text-white text-xl leading-none transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="flex-1 overflow-hidden rounded-xl bg-black/40 border border-white/10 flex items-center justify-center min-h-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.fileName}
            className="max-w-full max-h-[75vh] object-contain"
          />
        </div>

        {/* URL bar */}
        <div className="mt-3 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
          <span className="text-white/30 text-xs flex-shrink-0">CDN URL</span>
          <span className="text-[#e8c97e]/80 text-xs font-mono truncate flex-1">
            {cdnUrl}
          </span>
        </div>
      </div>
    </div>
  );
}
