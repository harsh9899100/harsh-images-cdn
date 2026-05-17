"use client";

import { useState, useRef, useCallback } from "react";
import { Category } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

interface UploadModalProps {
  onClose: () => void;
  onUploaded: () => void;
  defaultCategory?: Category;
  defaultProject?: string;
  existingCategories: { value: string; label: string; icon: string }[];
  onAddCustomCategory: (value: string, label: string, icon: string) => void;
}

export default function UploadModal({
  onClose,
  onUploaded,
  defaultCategory,
  defaultProject,
  existingCategories,
  onAddCustomCategory,
}: UploadModalProps) {
  const [category, setCategory] = useState<Category>(
    defaultCategory ?? (existingCategories[0]?.value || "real-estate")
  );
  const [project, setProject] = useState(defaultProject ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, "pending" | "done" | "error">>({});
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Custom category creation state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("📂");

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const imgs = Array.from(incoming).filter((f) =>
      f.type.startsWith("image/")
    );
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name + f.size));
      return [...prev, ...imgs.filter((f) => !names.has(f.name + f.size))];
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleCreateCategory = () => {
    if (!newCatName.trim()) return;
    const value = newCatName.trim().toLowerCase().replace(/\s+/g, "-");
    const label = newCatName.trim();
    const icon = newCatEmoji.trim() || "📂";

    onAddCustomCategory(value, label, icon);
    setCategory(value);

    // Reset category inputs
    setNewCatName("");
    setNewCatEmoji("📂");
    setShowAddCategory(false);
  };

  const handleUpload = async () => {
    if (!project.trim() || files.length === 0) return;
    setUploading(true);

    const init: Record<string, "pending" | "done" | "error"> = {};
    files.forEach((f) => (init[f.name] = "pending"));
    setProgress(init);

    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("project", project.trim());
      fd.append("category", category);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error();
        setProgress((p) => ({ ...p, [file.name]: "done" }));
      } catch {
        setProgress((p) => ({ ...p, [file.name]: "error" }));
      }
    }

    setUploading(false);
    onUploaded();
  };

  const allDone =
    Object.values(progress).length > 0 &&
    Object.values(progress).every((s) => s === "done");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#060608]/85 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-[#0e0e12] border border-white/5 rounded-3xl shadow-2xl overflow-hidden animate-scale-up glass-panel">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.01]">
          <h2 className="text-white font-extrabold text-lg tracking-tight display-font">
            Upload CDN Assets
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh] scrollbar-none">
          {/* Category Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold font-sans">
                Category
              </label>
              <button
                type="button"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="text-[10px] font-bold text-[#e8c97e] hover:underline"
              >
                {showAddCategory ? "Select Existing" : "+ New Category"}
              </button>
            </div>

            {showAddCategory ? (
              /* Add New Category Panel */
              <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-3 animate-fade-in">
                <p className="text-[10px] font-bold text-[#e8c97e]/80 uppercase tracking-wider">Create Custom Category</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={2}
                    value={newCatEmoji}
                    onChange={(e) => setNewCatEmoji(e.target.value)}
                    placeholder="Emoji (e.g. 📸)"
                    className="w-14 bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-center text-sm text-white focus:outline-none focus:border-[#e8c97e]/40"
                  />
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Category Name (e.g. Brand Assets)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#e8c97e]/40"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={!newCatName.trim()}
                  className="w-full py-2 bg-[#e8c97e]/20 border border-[#e8c97e]/35 text-[#e8c97e] rounded-xl text-xs font-bold hover:bg-[#e8c97e]/30 transition-all disabled:opacity-30"
                >
                  Confirm & Select Category
                </button>
              </div>
            ) : (
              /* Existing Categories Grid */
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {existingCategories.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-bold transition-all truncate ${category === c.value
                        ? "border-[#e8c97e] bg-[#e8c97e]/10 text-[#e8c97e] shadow-[0_0_15px_rgba(232,201,126,0.05)]"
                        : "border-white/5 bg-white/[0.01] text-white/50 hover:border-white/10 hover:text-white"
                      }`}
                  >
                    <span className="text-sm shrink-0">{c.icon}</span>{" "}
                    <span className="truncate">{c.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Project name */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block mb-2">
              Folder / Project Name
            </label>
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="e.g. Sunset Villa, Brand Identity…"
              disabled={uploading}
              className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-white/20 text-xs focus:outline-none focus:border-[#e8c97e]/40 focus:bg-white/[0.04] transition-all"
            />
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${dragging
                ? "border-[#e8c97e] bg-[#e8c97e]/5"
                : "border-white/10 bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.02]"
              }`}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            <div className="text-3xl mb-2">📥</div>
            <p className="text-white/70 text-xs font-semibold">
              Drop images here or <span className="text-[#e8c97e] hover:underline">browse</span>
            </p>
            <p className="text-white/20 text-[10px] mt-1 font-medium">
              JPEG, PNG, WebP, GIF, AVIF - max 10MB each
            </p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {files.map((f) => {
                const state = progress[f.name];
                return (
                  <div
                    key={f.name + f.size}
                    className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2"
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${state === "done"
                          ? "bg-green-400"
                          : state === "error"
                            ? "bg-red-400"
                            : state === "pending"
                              ? "bg-[#e8c97e] animate-pulse"
                              : "bg-white/20"
                        }`}
                    />
                    <span className="text-white/70 text-xs truncate flex-1 font-medium">
                      {f.name}
                    </span>
                    <span className="text-white/30 text-[10px] font-mono shrink-0">
                      {formatBytes(f.size)}
                    </span>
                    {!uploading && !state && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFiles((prev) => prev.filter((x) => x !== f));
                        }}
                        className="w-5 h-5 rounded-md hover:bg-white/5 text-white/20 hover:text-red-400 text-xs transition-colors flex items-center justify-center"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-white/[0.01]">
          {allDone ? (
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-green-500/10 border border-green-500/25 text-green-400 font-extrabold text-xs tracking-wider uppercase transition-colors"
            >
              ✓ Upload Complete - Close
            </button>
          ) : (
            <button
              onClick={handleUpload}
              disabled={uploading || !project.trim() || files.length === 0}
              className="w-full py-3 rounded-xl btn-aurum text-xs font-bold tracking-wider uppercase disabled:opacity-20 disabled:cursor-not-allowed"
            >
              {uploading
                ? `Uploading ${files.length} file${files.length !== 1 ? "s" : ""}…`
                : `Upload ${files.length > 0 ? files.length + " " : ""}Image${files.length !== 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
