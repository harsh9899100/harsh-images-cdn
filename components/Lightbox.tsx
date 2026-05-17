"use client";

import { useEffect, useState } from "react";
import { ProjectImage } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

interface LightboxProps {
  images: ProjectImage[];
  initialIndex: number;
  onClose: () => void;
  onDelete: (url: string) => void;
}

export default function Lightbox({
  images,
  initialIndex,
  onClose,
  onDelete,
}: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [copied, setCopied] = useState(false);

  const activeImage = images[currentIndex] || images[0];

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, images.length]);

  const handleDelete = async () => {
    if (!activeImage) return;
    if (!confirm(`Delete "${activeImage.fileName}" permanently?`)) return;
    
    const urlToDelete = activeImage.url;
    onDelete(urlToDelete);
    
    // Adjust index after deletion
    if (images.length <= 1) {
      onClose();
    } else {
      if (currentIndex >= images.length - 1) {
        setCurrentIndex(images.length - 2);
      }
    }
  };

  const copyUrl = () => {
    if (!activeImage) return;
    navigator.clipboard.writeText(activeImage.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activeImage) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#060606]/95 backdrop-blur-xl transition-all duration-300"
        onClick={onClose}
      />

      <div className="relative z-10 flex flex-col max-w-5xl w-full max-h-[95vh] h-full justify-between gap-4">
        {/* Top bar */}
        <div className="flex items-center justify-between glass-panel rounded-2xl px-5 py-3">
          <div className="min-w-0">
            <p className="text-white font-extrabold text-sm truncate max-w-[200px] sm:max-w-md display-font luxury-text-glow" title={activeImage.fileName}>
              {activeImage.fileName}
            </p>
            <p className="text-white/40 text-[10px] mt-1 font-semibold uppercase tracking-wider font-mono">
              {formatBytes(activeImage.size)} ·{" "}
              {new Date(activeImage.uploadedAt).toLocaleDateString()} · {currentIndex + 1} of {images.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={activeImage.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold transition-all border border-white/5"
            >
              Open URL ↗
            </a>
            <button
              onClick={copyUrl}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                copied
                  ? "bg-green-500/10 border-green-500/25 text-green-400"
                  : "bg-[#e8c97e]/15 border-[#e8c97e]/35 text-[#e8c97e] hover:bg-[#e8c97e]/25 shadow-glow-sm"
              }`}
            >
              {copied ? "Copied ✓" : "Copy CDN URL"}
            </button>
            <button
              onClick={handleDelete}
              className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 transition-all cursor-pointer"
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-white text-lg transition-colors ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Core viewer area */}
        <div className="flex-1 flex items-center justify-between relative min-h-0 group/viewer">
          {/* Previous Button */}
          {images.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-4 z-10 w-12 h-12 rounded-full bg-black/40 hover:bg-[#e8c97e] hover:text-black border border-white/10 hover:border-[#e8c97e]/40 text-white/70 flex items-center justify-center text-xl transition-all backdrop-blur-sm opacity-0 group-hover/viewer:opacity-100 focus:opacity-100 cursor-pointer"
            >
              ⟨
            </button>
          )}

          {/* Image Canvas */}
          <div className="w-full h-full flex items-center justify-center p-2 rounded-2xl bg-black/20 border border-white/5 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage.url}
              alt={activeImage.fileName}
              className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl transition-all duration-300 animate-fade-in"
              style={{ contentVisibility: "auto" }}
            />
          </div>

          {/* Next Button */}
          {images.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 z-10 w-12 h-12 rounded-full bg-black/40 hover:bg-[#e8c97e] hover:text-black border border-white/10 hover:border-[#e8c97e]/40 text-white/70 flex items-center justify-center text-xl transition-all backdrop-blur-sm opacity-0 group-hover/viewer:opacity-100 focus:opacity-100 cursor-pointer"
            >
              ⟩
            </button>
          )}
        </div>

        {/* Thumbnail strip & URL input */}
        <div className="flex flex-col gap-3 animate-fade-in">
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto py-2 px-1 max-w-full justify-start sm:justify-center scrollbar-none">
              {images.map((img, idx) => (
                <button
                  key={img.url}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    idx === currentIndex
                      ? "border-[#e8c97e] scale-105 shadow-lg"
                      : "border-white/5 opacity-40 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.fileName}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* URL bar */}
          <div className="flex items-center gap-3 glass-panel rounded-2xl px-5 py-3">
            <span className="text-white/30 text-[10px] font-extrabold uppercase tracking-widest flex-shrink-0">
              CDN URL
            </span>
            <span className="text-[#e8c97e] text-xs font-mono truncate flex-1 select-all cursor-pointer" onClick={copyUrl}>
              {activeImage.url}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

