"use client";

import { useState } from "react";
import { ProjectImage, Category } from "@/lib/types";
import { formatBytes, getCategoryDetails } from "@/lib/utils";

interface ProjectDetailsModalProps {
  project: string;
  category: Category;
  images: ProjectImage[];
  onClose: () => void;
  onImageClick: (img: ProjectImage) => void;
  onUpload: (category: Category, project: string) => void;
  onDelete: (url: string) => void;
  customCategories?: Record<string, { label: string; icon: string }>;
  onRenameSuccess?: () => void;
}

export default function ProjectDetailsModal({
  project,
  category,
  images,
  onClose,
  onImageClick,
  onUpload,
  onDelete,
  customCategories,
  onRenameSuccess,
}: ProjectDetailsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedAll, setCopiedAll] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Renaming & Deletion States
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(
    project
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
  const [loadingState, setLoadingState] = useState(false);

  const displayName = project
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const totalSize = images.reduce((s, i) => s + i.size, 0);

  const filteredImages = images.filter((img) =>
    img.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyAll = () => {
    const urls = images.map((img) => img.url).join("\n");
    navigator.clipboard.writeText(urls);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopySelected = () => {
    if (selectedUrls.size === 0) return;
    const urls = Array.from(selectedUrls).join("\n");
    navigator.clipboard.writeText(urls);
    alert(`Copied ${selectedUrls.size} selected URLs to clipboard!`);
    setIsSelectMode(false);
    setSelectedUrls(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedUrls.size === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete the ${selectedUrls.size} selected images permanently?`
      )
    )
      return;

    setLoadingState(true);
    for (const url of Array.from(selectedUrls)) {
      await onDelete(url);
    }
    alert("Selected images deleted successfully!");
    setIsSelectMode(false);
    setSelectedUrls(new Set());
    setLoadingState(false);
  };

  const toggleSelectImage = (url: string) => {
    const next = new Set(selectedUrls);
    if (next.has(url)) {
      next.delete(url);
    } else {
      next.add(url);
    }
    setSelectedUrls(next);
  };

  const toggleSelectAll = () => {
    if (selectedUrls.size === filteredImages.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(filteredImages.map((img) => img.url)));
    }
  };

  const handleDeleteFolder = async () => {
    if (
      !confirm(
        `⚠️ WARNING: Are you sure you want to permanently delete the entire folder "${displayName}" and all its ${images.length} images?\nThis action CANNOT be undone.`
      )
    ) {
      return;
    }

    setLoadingState(true);
    try {
      for (const img of images) {
        await onDelete(img.url);
      }
      alert(`Folder "${displayName}" has been deleted successfully!`);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to delete all assets in folder.");
    } finally {
      setLoadingState(false);
    }
  };

  const handleRenameFolder = async () => {
    if (!editedName.trim() || editedName.trim() === displayName) {
      setIsEditingName(false);
      return;
    }

    setLoadingState(true);
    try {
      const res = await fetch("/api/rename-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldCategory: category,
          oldProject: project,
          newProject: editedName.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Rename failed");
      }

      alert(`Folder renamed successfully to "${editedName.trim()}"!`);
      setIsEditingName(false);
      if (onRenameSuccess) {
        onRenameSuccess();
      }
      onClose();
    } catch (e: any) {
      alert(`Error renaming folder: ${e.message}`);
    } finally {
      setLoadingState(false);
    }
  };

  const catDetails = getCategoryDetails(category, customCategories);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#060608]/90 backdrop-blur-xl transition-all duration-300"
        onClick={onClose}
      />

      {/* Panel container */}
      <div className="relative z-10 w-full max-w-6xl h-[85vh] bg-[#0c0c10] border border-white/5 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-up glass-panel">
        
        {/* Loading Spinner Overlay */}
        {loadingState && (
          <div className="absolute inset-0 z-40 bg-[#060608]/85 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
            <div className="w-12 h-12 border-2 border-[#e8c97e]/20 border-t-[#e8c97e] rounded-full animate-spin mb-4" />
            <p className="text-[#e8c97e] text-xs font-bold uppercase tracking-widest font-mono">
              Processing Assets on Vercel…
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-white/5 bg-white/[0.01]">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              {isEditingName ? (
                /* Inline Rename Input */
                <div className="flex items-center gap-1.5 animate-fade-in">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameFolder();
                      if (e.key === "Escape") setIsEditingName(false);
                    }}
                    autoFocus
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-base font-bold text-white focus:outline-none focus:border-[#e8c97e] placeholder-white/20"
                  />
                  <button
                    onClick={handleRenameFolder}
                    className="w-8 h-8 rounded-xl bg-[#e8c97e] text-black font-bold flex items-center justify-center hover:bg-[#f0d898] transition-colors cursor-pointer"
                    title="Confirm Rename"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => {
                      setEditedName(displayName);
                      setIsEditingName(false);
                    }}
                    className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 text-white/50 flex items-center justify-center hover:text-white transition-colors cursor-pointer"
                    title="Cancel"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                /* Static Display Name with Edit Button */
                <div className="flex items-center gap-2 group/title">
                  <h2 className="text-white font-extrabold text-xl tracking-tight leading-none display-font luxury-text-glow">
                    {displayName}
                  </h2>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-[#e8c97e] hover:bg-[#e8c97e]/10 transition-all opacity-0 group-hover/title:opacity-100 focus:opacity-100 cursor-pointer"
                    title="Rename Folder"
                  >
                    ✏️
                  </button>
                </div>
              )}
              <span className="text-[9px] uppercase tracking-widest font-bold px-3 py-1 rounded-full bg-white/5 text-white/70 border border-white/10 shrink-0">
                {catDetails.icon} {catDetails.label}
              </span>
            </div>
            <p className="text-white/40 text-[11px] mt-2.5 font-semibold">
              {images.length} image{images.length !== 1 ? "s" : ""} ·{" "}
              {formatBytes(totalSize)} total size
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => onUpload(category, project)}
              className="px-5 py-2.5 btn-aurum text-black font-extrabold text-xs rounded-xl cursor-pointer"
            >
              + Upload Assets
            </button>
            <button
              onClick={handleCopyAll}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                copiedAll
                  ? "bg-green-500/10 border-green-500/25 text-green-400"
                  : "bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {copiedAll ? "Copied ✓" : "Copy All URLs"}
            </button>
            <button
              onClick={handleDeleteFolder}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold transition-all cursor-pointer"
              title="Delete Entire Folder"
            >
              🗑 Delete Folder
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Toolbar & Search */}
        <div className="px-6 py-3 border-b border-white/5 bg-white/[0.005] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search file name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.01] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#e8c97e]/40 transition-colors"
            />
            <span className="absolute right-3.5 top-3 text-white/20 text-xs">🔍</span>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
            <button
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                setSelectedUrls(new Set());
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isSelectMode
                  ? "bg-[#e8c97e]/10 border-[#e8c97e]/30 text-[#e8c97e] shadow-[0_0_15px_rgba(232,201,126,0.05)]"
                  : "bg-transparent border-white/5 text-white/40 hover:text-white"
              }`}
            >
              {isSelectMode ? "Cancel Selection" : "Bulk Select"}
            </button>

            {isSelectMode && (
              <div className="flex items-center gap-2 animate-fade-in">
                <button
                  onClick={toggleSelectAll}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-bold text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  {selectedUrls.size === filteredImages.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
                <button
                  onClick={handleCopySelected}
                  disabled={selectedUrls.size === 0}
                  className="px-3 py-2 bg-[#e8c97e]/20 border border-[#e8c97e]/30 text-[#e8c97e] rounded-xl text-xs font-bold transition-colors disabled:opacity-30 cursor-pointer"
                >
                  Copy ({selectedUrls.size})
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedUrls.size === 0}
                  className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl text-xs font-bold transition-colors disabled:opacity-30 cursor-pointer"
                >
                  Delete ({selectedUrls.size})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content list/grid of images */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-black/[0.08]">
          {filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-4xl mb-3">🔍</span>
              <p className="text-white/40 text-sm font-semibold">
                No images matching "{searchQuery}"
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredImages.map((img) => {
                const isSelected = selectedUrls.has(img.url);
                return (
                  <div
                    key={img.url}
                    onClick={() => {
                      if (isSelectMode) {
                        toggleSelectImage(img.url);
                      } else {
                        onImageClick(img);
                      }
                    }}
                    className={`group/item relative bg-white/[0.015] border rounded-2xl overflow-hidden hover:border-[#e8c97e]/25 hover:bg-white/[0.035] transition-all duration-300 flex flex-col cursor-pointer ${
                      isSelected
                        ? "border-[#e8c97e] ring-1 ring-[#e8c97e]/20 bg-[#e8c97e]/[0.01]"
                        : "border-white/5"
                    }`}
                  >
                    {/* Checkbox overlay for select mode */}
                    {isSelectMode && (
                      <div className="absolute top-2.5 left-2.5 z-20">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-[#e8c97e] border-[#e8c97e] text-black"
                              : "bg-black/60 border-white/20 text-transparent"
                          }`}
                        >
                          <span className="text-xs font-black leading-none select-none">✓</span>
                        </div>
                      </div>
                    )}

                    {/* Image thumb */}
                    <div className="relative aspect-square bg-black/20 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.fileName}
                        className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />

                      {/* Hover action bar (only visible when not in select mode) */}
                      {!isSelectMode && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 flex items-center justify-center gap-2 transition-all duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onImageClick(img);
                            }}
                            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
                            title="Zoom"
                          >
                            🔍
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(img.url);
                              alert("CDN URL copied to clipboard!");
                            }}
                            className="w-9 h-9 rounded-xl bg-[#e8c97e]/20 hover:bg-[#e8c97e]/35 border border-[#e8c97e]/30 text-[#e8c97e] flex items-center justify-center transition-colors cursor-pointer"
                            title="Copy URL"
                          >
                            🔗
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                confirm(
                                  `Delete image "${img.fileName}" permanently?`
                                )
                              ) {
                                onDelete(img.url);
                              }
                            }}
                            className="w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                            title="Delete"
                          >
                            🗑
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="p-3 min-w-0 flex-1 flex flex-col justify-between">
                      <p
                        className="text-white/80 font-bold text-[11px] truncate leading-tight group-hover/item:text-[#e8c97e] transition-colors"
                        title={img.fileName}
                      >
                        {img.fileName}
                      </p>
                      <div className="flex items-center justify-between gap-1 mt-2">
                        <span className="text-[10px] text-white/30 font-semibold font-mono">
                          {formatBytes(img.size)}
                        </span>
                        <span className="text-[9px] text-white/25 font-semibold">
                          {new Date(img.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
