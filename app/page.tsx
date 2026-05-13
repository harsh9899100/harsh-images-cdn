"use client";

import { useState, useEffect, useCallback } from "react";
import { ProjectImage, Category } from "@/lib/types";
import { CATEGORIES, groupImagesByProject } from "@/lib/utils";
import UploadModal from "@/components/UploadModal";
import ProjectCard from "@/components/ProjectCard";
import Lightbox from "@/components/Lightbox";

export default function Home() {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadDefaults, setUploadDefaults] = useState<{
    category?: Category;
    project?: string;
  }>({});
  const [lightbox, setLightbox] = useState<ProjectImage | null>(null);

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch("/api/images");
      const data = await res.json();
      setImages(data.images ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleDelete = async (url: string) => {
    await fetch("/api/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    setLightbox(null);
    fetchImages();
  };

  const filtered = images.filter((img) => {
    const matchCat = activeCategory === "all" || img.category === activeCategory;
    const matchSearch =
      !search ||
      img.project.includes(search.toLowerCase()) ||
      img.fileName.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = groupImagesByProject(filtered);
  const projectKeys = Object.keys(grouped).sort();

  const stats = {
    total: images.length,
    projects: Object.keys(groupImagesByProject(images)).length,
    realEstate: images.filter((i) => i.category === "real-estate").length,
    portfolio: images.filter((i) => i.category === "portfolio").length,
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <header className="border-b border-white/6 sticky top-0 z-40 bg-[#080808]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#e8c97e] flex items-center justify-center text-black font-bold text-sm">
              ◈
            </div>
            <div>
              <h1 className="text-white font-semibold text-base leading-none">ImageCDN</h1>
              <p className="text-white/30 text-[11px] mt-0.5">Vercel Blob Storage</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search projects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="hidden sm:block w-52 bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#e8c97e]/40 transition-colors"
            />
            <button
              onClick={() => { setUploadDefaults({}); setShowUpload(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#e8c97e] text-black rounded-lg font-semibold text-sm hover:bg-[#f0d898] transition-colors"
            >
              <span className="text-base leading-none">+</span> Upload
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Images", value: stats.total },
            { label: "Projects", value: stats.projects },
            { label: "Real Estate", value: stats.realEstate },
            { label: "Portfolio", value: stats.portfolio },
          ].map((s) => (
            <div key={s.label} className="bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3">
              <p className="text-white/35 text-[11px] uppercase tracking-widest font-medium">{s.label}</p>
              <p className="text-white text-2xl font-bold mt-1 tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCategory === "all" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setActiveCategory(c.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCategory === c.value ? "bg-white text-black" : "text-white/50 hover:text-white"}`}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-[#e8c97e]/30 border-t-[#e8c97e] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/30 text-sm">Loading images…</p>
            </div>
          </div>
        ) : projectKeys.length === 0 ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="text-5xl mb-4">🌄</div>
              <h2 className="text-white font-semibold text-xl mb-2">No images yet</h2>
              <p className="text-white/35 text-sm mb-6">Upload your first project images to get started.</p>
              <button
                onClick={() => { setUploadDefaults({}); setShowUpload(true); }}
                className="px-6 py-3 bg-[#e8c97e] text-black font-semibold rounded-xl text-sm hover:bg-[#f0d898] transition-colors"
              >
                Upload Images
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projectKeys.map((key) => {
              const imgs = grouped[key];
              const [cat, ...proj] = key.split("/");
              return (
                <ProjectCard
                  key={key}
                  project={proj.join("/")}
                  category={cat as Category}
                  images={imgs}
                  onImageClick={setLightbox}
                  onUpload={(category, project) => {
                    setUploadDefaults({ category, project });
                    setShowUpload(true);
                  }}
                />
              );
            })}
            <button
              onClick={() => { setUploadDefaults({}); setShowUpload(true); }}
              className="min-h-[200px] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-[#e8c97e]/30 hover:bg-[#e8c97e]/3 transition-all group"
            >
              <div className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center group-hover:border-[#e8c97e]/30 transition-colors">
                <span className="text-white/30 group-hover:text-[#e8c97e] text-xl transition-colors">+</span>
              </div>
              <p className="text-white/30 group-hover:text-white/50 text-sm font-medium transition-colors">New Project</p>
            </button>
          </div>
        )}
      </main>

      {showUpload && (
        <UploadModal
          defaultCategory={uploadDefaults.category}
          defaultProject={uploadDefaults.project}
          onClose={() => setShowUpload(false)}
          onUploaded={() => fetchImages()}
        />
      )}

      {lightbox && (
        <Lightbox
          image={lightbox}
          onClose={() => setLightbox(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
