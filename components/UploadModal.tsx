"use client";

import { useState, useRef, useCallback } from "react";
import { Category } from "@/lib/types";
import { CATEGORIES, formatBytes } from "@/lib/utils";

interface UploadModalProps {
  onClose: () => void;
  onUploaded: () => void;
  defaultCategory?: Category;
  defaultProject?: string;
}

export default function UploadModal({
  onClose,
  onUploaded,
  defaultCategory,
  defaultProject,
}: UploadModalProps) {
  const [category, setCategory] = useState<Category>(
    defaultCategory ?? "real-estate"
  );
  const [project, setProject] = useState(defaultProject ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, "pending" | "done" | "error">>({});
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <h2 className="text-white font-semibold text-lg tracking-tight">
            Upload Images
          </h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Category */}
          <div>
            <label className="text-xs uppercase tracking-widest text-white/40 font-medium block mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    category === c.value
                      ? "border-[#e8c97e] bg-[#e8c97e]/10 text-[#e8c97e]"
                      : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                  }`}
                >
                  <span>{c.icon}</span> {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Project name */}
          <div>
            <label className="text-xs uppercase tracking-widest text-white/40 font-medium block mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="e.g. Sunset Villa, Brand Identity…"
              disabled={uploading}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#e8c97e]/50 focus:bg-white/8 transition-all"
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
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragging
                ? "border-[#e8c97e] bg-[#e8c97e]/5"
                : "border-white/15 hover:border-white/30 hover:bg-white/3"
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
            <div className="text-3xl mb-2">📁</div>
            <p className="text-white/50 text-sm">
              Drop images here or{" "}
              <span className="text-[#e8c97e]">browse</span>
            </p>
            <p className="text-white/25 text-xs mt-1">
              JPEG, PNG, WebP, GIF, AVIF — max 10MB each
            </p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {files.map((f) => {
                const state = progress[f.name];
                return (
                  <div
                    key={f.name + f.size}
                    className="flex items-center gap-3 bg-white/4 rounded-lg px-3 py-2"
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        state === "done"
                          ? "bg-green-400"
                          : state === "error"
                          ? "bg-red-400"
                          : state === "pending"
                          ? "bg-[#e8c97e] animate-pulse"
                          : "bg-white/20"
                      }`}
                    />
                    <span className="text-white/70 text-sm truncate flex-1">
                      {f.name}
                    </span>
                    <span className="text-white/30 text-xs flex-shrink-0">
                      {formatBytes(f.size)}
                    </span>
                    {!uploading && !state && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFiles((prev) => prev.filter((x) => x !== f));
                        }}
                        className="text-white/25 hover:text-red-400 text-xs ml-1 transition-colors"
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
        <div className="px-6 pb-6">
          {allDone ? (
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 font-medium text-sm"
            >
              ✓ All uploaded — Close
            </button>
          ) : (
            <button
              onClick={handleUpload}
              disabled={uploading || !project.trim() || files.length === 0}
              className="w-full py-3 rounded-xl bg-[#e8c97e] text-black font-semibold text-sm hover:bg-[#f0d898] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
