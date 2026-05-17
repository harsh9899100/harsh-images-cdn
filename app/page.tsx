"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ProjectImage, Category } from "@/lib/types";
import { DEFAULT_CATEGORIES, getCategoryDetails, groupImagesByProject, formatBytes } from "@/lib/utils";
import UploadModal from "@/components/UploadModal";
import ProjectCard from "@/components/ProjectCard";
import Lightbox from "@/components/Lightbox";
import ProjectDetailsModal from "@/components/ProjectDetailsModal";

export default function Home() {
  // Passcode authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);

  const [images, setImages] = useState<ProjectImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadDefaults, setUploadDefaults] = useState<{
    category?: Category;
    project?: string;
  }>({});

  // View & Sorting state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "count" | "size" | "recent">("recent");

  // Custom categories state persisted in localStorage
  const [customCategories, setCustomCategories] = useState<Record<string, { label: string; icon: string }>>({});

  // Selected project details modal state
  const [selectedProjectKey, setSelectedProjectKey] = useState<string | null>(null);

  // Lightbox slideshow state
  const [lightboxContext, setLightboxContext] = useState<{
    images: ProjectImage[];
    index: number;
  } | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const isAuth = localStorage.getItem("cdn_is_authenticated");
    if (isAuth === "true") {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleUnlock = () => {
    if (passwordInput === "203829") {
      localStorage.setItem("cdn_is_authenticated", "true");
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 500);
    }
  };

  // Load custom categories from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("cdn_custom_categories");
    if (saved) {
      try {
        setCustomCategories(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse custom categories:", e);
      }
    }
  }, []);

  const handleAddCustomCategory = (value: string, label: string, icon: string) => {
    const updated = {
      ...customCategories,
      [value]: { label, icon },
    };
    setCustomCategories(updated);
    localStorage.setItem("cdn_custom_categories", JSON.stringify(updated));
  };

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
    try {
      await fetch("/api/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      await fetchImages();
    } catch (error) {
      console.error("Failed to delete image:", error);
    }
  };

  // Build the list of all available categories dynamically
  const categoriesList = useMemo(() => {
    // 1. Start with defaults
    const list = [...DEFAULT_CATEGORIES];

    // 2. Add custom ones stored in localStorage
    Object.entries(customCategories).forEach(([value, details]) => {
      if (!list.some((c) => c.value === value)) {
        list.push({ value, ...details });
      }
    });

    // 3. Scan fetched images to see if there are any other categories uploaded that aren't defined yet
    images.forEach((img) => {
      if (!list.some((c) => c.value === img.category)) {
        const details = getCategoryDetails(img.category, customCategories);
        list.push({ value: img.category, ...details });
      }
    });

    return list;
  }, [images, customCategories]);

  // Filtered images
  const filtered = useMemo(() => {
    return images.filter((img) => {
      const matchCat = activeCategory === "all" || img.category === activeCategory;
      const matchSearch =
        !search ||
        img.project.toLowerCase().includes(search.toLowerCase()) ||
        img.fileName.toLowerCase().includes(search.toLowerCase()) ||
        img.category.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [images, activeCategory, search]);

  // Grouped images by project folder
  const grouped = useMemo(() => {
    return groupImagesByProject(filtered);
  }, [filtered]);

  // Sorted project keys
  const sortedProjectKeys = useMemo(() => {
    return Object.keys(grouped).sort((a, b) => {
      const imgsA = grouped[a] || [];
      const imgsB = grouped[b] || [];

      if (sortBy === "name") {
        return a.localeCompare(b);
      }

      if (sortBy === "count") {
        return imgsB.length - imgsA.length;
      }

      if (sortBy === "size") {
        const sizeA = imgsA.reduce((sum, img) => sum + img.size, 0);
        const sizeB = imgsB.reduce((sum, img) => sum + img.size, 0);
        return sizeB - sizeA;
      }

      if (sortBy === "recent") {
        const getLatest = (list: ProjectImage[]) => {
          if (list.length === 0) return 0;
          return Math.max(...list.map((x) => new Date(x.uploadedAt).getTime()));
        };
        return getLatest(imgsB) - getLatest(imgsA);
      }

      return 0;
    });
  }, [grouped, sortBy]);

  // Calculate dynamic stats from all images
  const stats = useMemo(() => {
    const total = images.length;
    const totalSize = images.reduce((sum, img) => sum + img.size, 0);
    const allGrouped = groupImagesByProject(images);
    const projectsCount = Object.keys(allGrouped).length;

    return {
      total,
      totalSize,
      projects: projectsCount,
      categoriesCount: categoriesList.length,
    };
  }, [images, categoriesList]);

  // Resolve currently active selected project images dynamically from main images list
  const selectedProjectData = useMemo(() => {
    if (!selectedProjectKey) return null;
    const imgs = grouped[selectedProjectKey] || [];
    const [cat, ...projParts] = selectedProjectKey.split("/");
    return {
      category: cat,
      project: projParts.join("/"),
      images: imgs,
    };
  }, [selectedProjectKey, grouped]);

  if (isAuthenticated === null) {
    return <div className="min-h-screen bg-[#060608]" />;
  }

  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center p-4 relative overflow-hidden text-white">
        {/* Dynamic background glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#e8c97e]/[0.03] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/[0.015] rounded-full blur-[100px] pointer-events-none" />

        <div className={`w-full max-w-sm glass-panel p-8 rounded-3xl text-center shadow-2xl relative z-10 transition-all ${authError ? "animate-shake border-red-500/30" : "border-white/5"}`}>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#e8c97e] to-[#c5a254] flex items-center justify-center text-black font-black text-xl shadow-[0_0_25px_rgba(232,201,126,0.15)] mx-auto mb-5 animate-pulse">
            ◈
          </div>
          <h2 className="text-white font-extrabold text-lg tracking-widest uppercase display-font luxury-text-glow">
            AURUM CDN
          </h2>
          <p className="text-white/35 text-[10px] tracking-wider uppercase font-bold mt-1.5 font-mono">
            Secured Asset Terminal
          </p>

          <div className="mt-8 space-y-4">
            <div className="relative">
              <input
                type="password"
                placeholder="Enter Terminal Key"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                className={`w-full bg-white/[0.02] border rounded-2xl px-5 py-3.5 text-center text-sm text-white placeholder-white/20 focus:outline-none transition-all duration-300 ${authError ? "border-red-500/30 focus:border-red-500 bg-red-500/[0.01]" : "border-white/5 focus:border-[#e8c97e]/40 focus:bg-white/[0.04]"}`}
              />
            </div>
            <button
              onClick={handleUnlock}
              className="w-full py-3.5 rounded-2xl btn-aurum text-xs font-bold tracking-widest uppercase hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
            >
              Unlock Terminal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#f3f4f6]">
      {/* Dynamic luxury background glowing orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#e8c97e]/[0.02] rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-500/[0.015] rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Floating Header */}
      <header className="border-b border-white/5 sticky top-0 z-40 bg-[#060608]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#e8c97e] to-[#c5a254] flex items-center justify-center text-black font-black text-lg shadow-[0_0_20px_rgba(232,201,126,0.2)]">
              ◈
            </div>
            <div>
              <h1 className="text-white font-extrabold text-lg tracking-wider display-font luxury-text-glow">
                A U R U M <span className="text-[#e8c97e]">C D N</span>
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-emerald" />
                <span className="text-white/40 text-[9px] uppercase tracking-widest font-extrabold font-mono">
                  Storage Operational
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Elegant search bar */}
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Search projects or assets…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-72 bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#e8c97e]/40 focus:bg-white/[0.04] transition-all duration-300"
              />
              <span className="absolute right-4 top-3.5 text-white/20 text-xs">🔍</span>
            </div>

            <button
              onClick={() => {
                setUploadDefaults({
                  category: activeCategory !== "all" ? activeCategory : undefined
                });
                setShowUpload(true);
              }}
              className="flex items-center gap-2 px-6 py-3 btn-aurum rounded-2xl font-bold text-xs hover:scale-[1.02] transition-all cursor-pointer"
            >
              <span>+</span> Upload Images
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Luxury Stats Desk */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Assets", value: stats.total, sub: "Indexed files", color: "text-white" },
            { label: "Total Weight", value: formatBytes(stats.totalSize), sub: "Vercel Blob size", color: "text-[#e8c97e]" },
            { label: "Asset Folders", value: stats.projects, sub: "Project groups", color: "text-[#e8c97e]" },
            { label: "Total Categories", value: stats.categoriesCount, sub: "Dynamic divisions", color: "text-white/80" },
          ].map((s) => (
            <div
              key={s.label}
              className="glass-panel rounded-3xl px-6 py-5 flex flex-col justify-between shadow-2xl relative overflow-hidden group/stat"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/[0.01] to-transparent rounded-full pointer-events-none" />
              <div>
                <p className="text-white/30 text-[10px] uppercase tracking-widest font-extrabold">{s.label}</p>
                <p className={`text-3xl font-black mt-2.5 tracking-tight tabular-nums display-font ${s.color}`}>
                  {s.value}
                </p>
              </div>
              <p className="text-white/20 text-[10px] mt-2 font-medium tracking-wide">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Toolbar Control Center */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8 glass-panel rounded-3xl p-4 shadow-2xl">
          {/* Dynamic Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 uppercase tracking-wider ${
                activeCategory === "all"
                  ? "bg-white text-black font-extrabold shadow-lg"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              All Divisions
            </button>
            {categoriesList.map((c) => (
              <button
                key={c.value}
                onClick={() => setActiveCategory(c.value)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 uppercase tracking-wider flex items-center gap-2 ${
                  activeCategory === c.value
                    ? "bg-white text-black font-extrabold shadow-lg"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{c.icon}</span> <span>{c.label}</span>
              </button>
            ))}
            {/* Quick add category button */}
            <button
              onClick={() => {
                setUploadDefaults({});
                setShowUpload(true);
              }}
              className="px-3 py-2.5 rounded-2xl text-xs font-bold text-[#e8c97e]/60 hover:text-[#e8c97e] hover:bg-white/5 transition-all shrink-0 uppercase tracking-wider border border-[#e8c97e]/10 border-dashed"
              title="Add Dynamic Category"
            >
              + Create Category
            </button>
          </div>

          {/* Controls Panel */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            {/* Search (Mobile) */}
            <div className="relative sm:hidden flex-1">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-white/20"
              />
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-2.5 shrink-0">
              <span className="text-white/30 text-[10px] uppercase font-extrabold tracking-wider">Sort:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent border-0 text-xs font-extrabold text-white/80 focus:outline-none cursor-pointer"
              >
                <option value="recent">Recently Uploaded</option>
                <option value="name">Folder A-Z</option>
                <option value="count">File Count</option>
                <option value="size">Storage Weight</option>
              </select>
            </div>

            {/* Layout Toggle */}
            <div className="flex items-center bg-white/[0.02] border border-white/5 rounded-2xl p-1 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "grid" ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white"
                }`}
              >
                Grid View
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "list" ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white"
                }`}
              >
                Table View
              </button>
            </div>
          </div>
        </div>

        {/* Content Container */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-10 h-10 border-2 border-[#e8c97e]/20 border-t-[#e8c97e] rounded-full animate-spin mb-4" />
            <p className="text-white/30 text-xs font-bold uppercase tracking-widest font-mono">Loading Dynamic CDN Assets…</p>
          </div>
        ) : sortedProjectKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center glass-panel rounded-3xl p-8 max-w-xl mx-auto">
            <div className="text-5xl mb-4">🌄</div>
            <h2 className="text-white font-extrabold text-lg mb-2 display-font">No Assets Found</h2>
            <p className="text-white/30 text-xs max-w-xs mx-auto mb-6 font-medium">
              No project folders match your filters. Create a new folder or upload some images to begin!
            </p>
            <button
              onClick={() => {
                setUploadDefaults({});
                setShowUpload(true);
              }}
              className="px-6 py-3 btn-aurum text-xs font-bold rounded-xl"
            >
              Upload Images
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View Mode */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {sortedProjectKeys.map((key) => {
              const imgs = grouped[key] || [];
              const [cat, ...projParts] = key.split("/");
              return (
                <ProjectCard
                  key={key}
                  project={projParts.join("/")}
                  category={cat}
                  images={imgs}
                  customCategories={customCategories}
                  onViewDetails={() => setSelectedProjectKey(key)}
                  onUpload={(category, project) => {
                    setUploadDefaults({ category, project });
                    setShowUpload(true);
                  }}
                />
              );
            })}

            {/* Quick Create Card */}
            <div
              onClick={() => {
                setUploadDefaults({});
                setShowUpload(true);
              }}
              className="min-h-[220px] border border-dashed border-white/5 bg-white/[0.005] hover:bg-white/[0.015] hover:border-[#e8c97e]/20 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl border border-white/5 flex items-center justify-center group-hover:border-[#e8c97e]/20 transition-all bg-white/[0.01]">
                <span className="text-white/30 group-hover:text-[#e8c97e] text-xl font-light transition-colors">+</span>
              </div>
              <p className="text-white/35 group-hover:text-white/60 text-xs font-bold tracking-wider uppercase transition-colors">
                New Folder
              </p>
            </div>
          </div>
        ) : (
          /* List View Mode (Luxury table format) */
          <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.005] text-white/35 text-[10px] uppercase tracking-wider font-extrabold">
                    <th className="px-6 py-4.5">Asset Folder</th>
                    <th className="px-6 py-4.5">Division</th>
                    <th className="px-6 py-4.5 text-center">Files</th>
                    <th className="px-6 py-4.5 text-right">Size Weight</th>
                    <th className="px-6 py-4.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {sortedProjectKeys.map((key) => {
                    const imgs = grouped[key] || [];
                    const [cat, ...projParts] = key.split("/");
                    const folderName = projParts.join("/");
                    const displayName = folderName
                      .split("-")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" ");
                    const sizeSum = imgs.reduce((sum, img) => sum + img.size, 0);
                    const catDetails = getCategoryDetails(cat, customCategories);

                    return (
                      <tr
                        key={key}
                        className="hover:bg-white/[0.015] cursor-pointer transition-colors group"
                        onClick={() => setSelectedProjectKey(key)}
                      >
                        <td className="px-6 py-4.5 font-bold text-white group-hover:text-[#e8c97e] transition-colors flex items-center gap-3">
                          <span className="text-base shrink-0">📂</span>
                          <span>{displayName}</span>
                        </td>
                        <td className="px-6 py-4.5">
                          <span className="text-[9px] uppercase tracking-widest font-bold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
                            {catDetails.icon} {catDetails.label}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-center font-bold tabular-nums text-white/70">
                          {imgs.length}
                        </td>
                        <td className="px-6 py-4.5 text-right font-medium tabular-nums text-white/55">
                          {formatBytes(sizeSum)}
                        </td>
                        <td className="px-6 py-4.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end items-center gap-2.5">
                            <button
                              onClick={() => {
                                setUploadDefaults({ category: cat, project: folderName });
                                setShowUpload(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#e8c97e]/10 border border-[#e8c97e]/20 text-[#e8c97e] hover:bg-[#e8c97e]/20 transition-all font-bold text-[11px]"
                            >
                              Add Assets
                            </button>
                            <button
                              onClick={() => setSelectedProjectKey(key)}
                              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-white/65 hover:bg-white/10 hover:text-white transition-all font-bold text-[11px]"
                            >
                              Browse Folder
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Luxury Footer */}
      <footer className="border-t border-white/5 py-8 mt-16 bg-white/[0.003] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-[10px] font-bold tracking-widest uppercase font-mono">
            &copy; {new Date().getFullYear()} Aurum CDN. All Rights Reserved.
          </p>
          <p className="text-white/40 text-xs font-bold tracking-wider uppercase">
            Developed by{" "}
            <a
              href="https://harsh-softwaredev.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#e8c97e] font-extrabold hover:text-[#f0d898] transition-all hover:underline"
            >
              Harsh Patel
            </a>
          </p>
        </div>
      </footer>

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          defaultCategory={uploadDefaults.category}
          defaultProject={uploadDefaults.project}
          existingCategories={categoriesList}
          onAddCustomCategory={handleAddCustomCategory}
          onClose={() => setShowUpload(false)}
          onUploaded={() => fetchImages()}
          existingImages={images}
        />
      )}

      {/* Project Details Modal */}
      {selectedProjectData && (
        <ProjectDetailsModal
          project={selectedProjectData.project}
          category={selectedProjectData.category}
          images={selectedProjectData.images}
          customCategories={customCategories}
          onClose={() => setSelectedProjectKey(null)}
          onImageClick={(img) => {
            const idx = selectedProjectData.images.findIndex((x) => x.url === img.url);
            setLightboxContext({
              images: selectedProjectData.images,
              index: idx >= 0 ? idx : 0,
            });
          }}
          onUpload={(category, project) => {
            setUploadDefaults({ category, project });
            setShowUpload(true);
          }}
          onDelete={handleDelete}
          onRenameSuccess={() => fetchImages()}
        />
      )}

      {/* Lightbox Slideshow Modal */}
      {lightboxContext && (
        <Lightbox
          images={lightboxContext.images}
          initialIndex={lightboxContext.index}
          onClose={() => setLightboxContext(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
