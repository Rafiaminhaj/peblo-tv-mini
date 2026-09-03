import React, { useState, useEffect } from 'react';

const API_BASE = "http://localhost:8000";

export default function App() {
  const [role, setRole] = useState("admin"); // admin vs editor
  const [activeTab, setActiveTab] = useState("shows"); // shows, validation, publish
  const [shows, setShows] = useState([]);
  const [validationReport, setValidationReport] = useState(null);
  const [publishHistory, setPublishHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Form State
  const [selectedShow, setSelectedShow] = useState(null);
  const [newShow, setNewShow] = useState({ title: "", description: "", section: "Animated Stories", category: "Adventure" });

  // Artwork Upload Form State
  const [uploadTarget, setUploadTarget] = useState({ type: "show", id: null });
  const [artworkType, setArtworkType] = useState("poster");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    fetchShows();
    fetchValidationReport();
    fetchPublishHistory();
  }, [role]);

  const fetchShows = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/shows`, {
        headers: { "X-User-Role": role }
      });
      if (res.ok) {
        const data = await res.json();
        setShows(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchValidationReport = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/validation-report`, {
        headers: { "X-User-Role": role }
      });
      if (res.ok) {
        const data = await res.json();
        setValidationReport(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPublishHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/publish-history`, {
        headers: { "X-User-Role": role }
      });
      if (res.ok) {
        const data = await res.json();
        setPublishHistory(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateShow = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/shows`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Role": role
        },
        body: JSON.stringify(newShow)
      });
      if (res.ok) {
        setMsg({ type: "success", text: "Show created successfully!" });
        setNewShow({ title: "", description: "", section: "Animated Stories", category: "Adventure" });
        fetchShows();
        fetchValidationReport();
      }
    } catch (err) {
      setMsg({ type: "error", text: "Failed to create show." });
    }
    setLoading(false);
  };

  const handleUploadArtwork = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploadError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("artwork_type", artworkType);
    formData.append("file", selectedFile);
    if (uploadTarget.type === "show") {
      formData.append("show_id", uploadTarget.id);
    } else {
      formData.append("episode_id", uploadTarget.id);
    }

    try {
      const res = await fetch(`${API_BASE}/admin/artwork/upload`, {
        method: "POST",
        headers: { "X-User-Role": role },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.detail || "Validation Error");
      } else {
        setMsg({ type: "success", text: data.message });
        setSelectedFile(null);
        fetchShows();
        fetchValidationReport();
      }
    } catch (err) {
      setUploadError("Network Error uploading artwork.");
    }
    setLoading(false);
  };

  const handleTriggerPublish = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/catalog/publish`, {
        method: "POST",
        headers: { "X-User-Role": role }
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "error", text: data.detail?.message || "Publish Failed" });
      } else {
        setMsg({ type: "success", text: data.message });
        fetchPublishHistory();
        fetchValidationReport();
      }
    } catch (err) {
      setMsg({ type: "error", text: "Network error triggering publish." });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg font-bold text-xl text-white">Peblo CMS</div>
          <div>
            <h1 className="font-semibold text-lg">Peblo TV — Content Editor Portal</h1>
            <p className="text-xs text-slate-400">Manage Shows, Validate Artwork, & Publish Catalogue</p>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="flex items-center gap-4 bg-slate-800 p-1.5 rounded-lg text-sm border border-slate-700">
          <span className="text-xs text-slate-400 pl-2">Active Role:</span>
          <button
            onClick={() => setRole("editor")}
            className={`px-3 py-1 rounded font-medium transition ${role === "editor" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            Editor
          </button>
          <button
            onClick={() => setRole("admin")}
            className={`px-3 py-1 rounded font-medium transition ${role === "admin" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            Admin
          </button>
        </div>
      </header>

      {/* Main Tabs */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-6 flex gap-6 text-sm">
        <button
          onClick={() => setActiveTab("shows")}
          className={`py-3 font-medium border-b-2 transition ${activeTab === "shows" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-white"}`}
        >
          Shows & Artwork Slots ({shows.length})
        </button>
        <button
          onClick={() => setActiveTab("validation")}
          className={`py-3 font-medium border-b-2 transition flex items-center gap-2 ${activeTab === "validation" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-white"}`}
        >
          Validation Report
          {validationReport?.total_issues_count > 0 && (
            <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {validationReport.total_issues_count}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("publish")}
          className={`py-3 font-medium border-b-2 transition ${activeTab === "publish" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-white"}`}
        >
          Atomic Publish Dashboard
        </button>
      </div>

      {/* Global Message Banner */}
      {msg.text && (
        <div className={`mx-6 mt-4 p-3 rounded-lg text-sm flex justify-between items-center ${msg.type === "error" ? "bg-rose-900/50 border border-rose-700 text-rose-200" : "bg-emerald-900/50 border border-emerald-700 text-emerald-200"}`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg({ type: "", text: "" })} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Tab Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeTab === "shows" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Show Panel */}
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 h-fit">
              <h2 className="text-base font-semibold mb-4 text-indigo-400">Create New Show</h2>
              <form onSubmit={handleCreateShow} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Show Title</label>
                  <input
                    type="text"
                    required
                    value={newShow.title}
                    onChange={(e) => setNewShow({ ...newShow, title: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Moti's Many Lives"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={newShow.category}
                    onChange={(e) => setNewShow({ ...newShow, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Adventure, Math"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Section</label>
                  <select
                    value={newShow.section}
                    onChange={(e) => setNewShow({ ...newShow, section: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Animated Stories">Animated Stories</option>
                    <option value="Learning">Learning</option>
                    <option value="Games">Games</option>
                    <option value="News & Discoveries">News & Discoveries</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={newShow.description}
                    onChange={(e) => setNewShow({ ...newShow, description: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Brief synopsis..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded transition"
                >
                  Save Show Draft
                </button>
              </form>
            </div>

            {/* Shows List & Artwork Slot Uploaders */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-base font-semibold text-slate-300">Catalogue Shows & Artwork Slots</h2>
              {shows.map((show) => (
                <div key={show.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded border border-indigo-800 font-medium">
                        {show.section || "No Section"}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-1">{show.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{show.description}</p>
                    </div>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded font-mono">
                      Category: {show.category}
                    </span>
                  </div>

                  {/* Artwork Upload Slots */}
                  <div className="border-t border-slate-800 pt-4">
                    <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                      3 Required Artwork Upload Slots (Max 200 KB)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {/* Slot 1: Poster */}
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <div className="font-semibold text-slate-200">1. Poster Slot (2:3)</div>
                        <div className="text-[10px] text-slate-500 mb-2">Target ~600x900px</div>
                        {show.artworks.find(a => a.artwork_type === "poster") ? (
                          <div className="text-emerald-400 font-medium flex items-center gap-1">✓ Uploaded</div>
                        ) : (
                          <button
                            onClick={() => {
                              setUploadTarget({ type: "show", id: show.id });
                              setArtworkType("poster");
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-indigo-300 w-full py-1.5 rounded text-[11px]"
                          >
                            + Upload Poster
                          </button>
                        )}
                      </div>

                      {/* Slot 2: Banner */}
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <div className="font-semibold text-slate-200">2. Banner Slot (16:9)</div>
                        <div className="text-[10px] text-slate-500 mb-2">Target ~1280x720px</div>
                        {show.artworks.find(a => a.artwork_type === "banner") ? (
                          <div className="text-emerald-400 font-medium flex items-center gap-1">✓ Uploaded</div>
                        ) : (
                          <button
                            onClick={() => {
                              setUploadTarget({ type: "show", id: show.id });
                              setArtworkType("banner");
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-indigo-300 w-full py-1.5 rounded text-[11px]"
                          >
                            + Upload Banner
                          </button>
                        )}
                      </div>

                      {/* Slot 3: Thumbnail */}
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <div className="font-semibold text-slate-200">3. Thumbnail Slot (16:9)</div>
                        <div className="text-[10px] text-slate-500 mb-2">Target ~640x360px</div>
                        <div className="text-slate-500">Attach per Episode</div>
                      </div>
                    </div>

                    {/* Upload Modal Form inline */}
                    {uploadTarget.id === show.id && (
                      <form onSubmit={handleUploadArtwork} className="mt-4 bg-slate-950 p-4 rounded-lg border border-indigo-900 space-y-3">
                        <div className="flex justify-between items-center text-xs font-semibold text-indigo-300">
                          <span>Upload {artworkType.toUpperCase()} Artwork for "{show.title}"</span>
                          <button type="button" onClick={() => setUploadTarget({ type: "show", id: null })} className="text-slate-500">✕ Cancel</button>
                        </div>
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          onChange={(e) => setSelectedFile(e.target.files[0])}
                          className="text-xs text-slate-400"
                        />
                        {uploadError && (
                          <div className="bg-rose-950 border border-rose-800 text-rose-300 p-2.5 rounded text-xs leading-relaxed">
                            ⚠️ <strong>Upload Rejected by Pillow Validator:</strong><br />
                            {uploadError}
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={!selectedFile || loading}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded font-medium"
                        >
                          Validate & Upload File
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validation Report Tab */}
        {activeTab === "validation" && validationReport && (
          <div className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <h2 className="text-lg font-bold text-white mb-2">Publish Readiness & Validation Report</h2>
              <p className="text-sm text-slate-400">
                Surfaces all issues blocking catalogue publication. Editors can resolve these issues directly without asking an engineer.
              </p>

              <div className="mt-4 flex gap-4">
                <div className={`px-4 py-2 rounded-lg text-sm font-semibold border ${validationReport.is_publish_blocked ? "bg-rose-950 border-rose-800 text-rose-300" : "bg-emerald-950 border-emerald-800 text-emerald-300"}`}>
                  Status: {validationReport.is_publish_blocked ? "❌ PUBLISH BLOCKED" : "✓ READY TO PUBLISH"}
                </div>
                <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 font-mono">
                  Total Issues: {validationReport.total_issues_count}
                </div>
              </div>
            </div>

            {/* Issue Groups */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <h3 className="font-semibold text-amber-400 mb-3">Missing Artworks ({validationReport.issues.missing_artworks.length})</h3>
                {validationReport.issues.missing_artworks.length === 0 ? (
                  <p className="text-xs text-emerald-400">✓ All required artworks present.</p>
                ) : (
                  <ul className="space-y-2 text-xs text-slate-300">
                    {validationReport.issues.missing_artworks.map((item, idx) => (
                      <li key={idx} className="bg-slate-950 p-2.5 rounded border border-slate-800">
                        <strong className="text-white">{item.title}</strong>: {item.reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <h3 className="font-semibold text-amber-400 mb-3">Missing Sections ({validationReport.issues.missing_sections.length})</h3>
                {validationReport.issues.missing_sections.length === 0 ? (
                  <p className="text-xs text-emerald-400">✓ All shows assigned to sections.</p>
                ) : (
                  <ul className="space-y-2 text-xs text-slate-300">
                    {validationReport.issues.missing_sections.map((item, idx) => (
                      <li key={idx} className="bg-slate-950 p-2.5 rounded border border-slate-800">
                        <strong className="text-white">{item.title}</strong>: {item.reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Publish Tab */}
        {activeTab === "publish" && (
          <div className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <h2 className="text-lg font-bold text-white mb-2">Atomic Catalogue Publishing Dashboard</h2>
              <p className="text-sm text-slate-400 mb-4">
                Generates and writes <code className="text-indigo-400 bg-slate-950 px-1 py-0.5 rounded">catalogue.json</code> via an atomic temp-file swap. Only Admin users can trigger this action.
              </p>

              {role !== "admin" ? (
                <div className="bg-amber-950 border border-amber-800 text-amber-300 p-4 rounded-lg text-sm">
                  🔒 <strong>Publish Button Disabled:</strong> You are currently logged in with the <strong>Editor</strong> role. Please switch your role to <strong>Admin</strong> in the header to trigger publication.
                </div>
              ) : (
                <button
                  onClick={handleTriggerPublish}
                  disabled={loading || validationReport?.is_publish_blocked}
                  className={`px-6 py-3 rounded-lg font-bold text-sm transition ${validationReport?.is_publish_blocked ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700" : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"}`}
                >
                  {validationReport?.is_publish_blocked ? "Publish Blocked (Resolve Issues First)" : "⚡ Trigger Atomic Catalogue Publish"}
                </button>
              )}
            </div>

            {/* Run History */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <h3 className="font-semibold text-slate-200 mb-4">Publish Run History Log</h3>
              <div className="space-y-2 text-xs">
                {publishHistory.map((run) => (
                  <div key={run.id} className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${run.status === "success" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-rose-950 text-rose-400 border border-rose-800"}`}>
                        {run.status.toUpperCase()}
                      </span>
                      <span className="text-slate-400 ml-3">{new Date(run.timestamp).toLocaleString()}</span>
                      <p className="text-slate-300 mt-1 font-mono text-[11px]">{run.log_message}</p>
                    </div>
                    <span className="text-slate-500">Admin: {run.admin_id}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
