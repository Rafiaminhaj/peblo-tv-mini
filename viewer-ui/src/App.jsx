import React, { useState, useEffect } from 'react';

const API_BASE = "http://localhost:8000";

export default function App() {
  const [catalogue, setCatalogue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [activeLangVariant, setActiveLangVariant] = useState("en");

  useEffect(() => {
    fetchCatalogue();
  }, []);

  const fetchCatalogue = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/catalog`);
      if (res.ok) {
        const data = await res.json();
        setCatalogue(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery && selectedLanguage === "all") {
      fetchCatalogue();
      return;
    }
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append("q", searchQuery);
      if (selectedLanguage !== "all") queryParams.append("language", selectedLanguage);

      const res = await fetch(`${API_BASE}/catalog/search?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        // Format search results into a section layout
        setCatalogue({
          sections: [
            {
              section_name: "Search Results",
              shows: data.results
            }
          ]
        });
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-sm font-medium text-slate-400">Loading Peblo TV Streaming Universe...</p>
      </div>
    );
  }

  // Get Featured Hero Show (First show in first section)
  const heroShow = catalogue?.sections?.[0]?.shows?.[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navbar */}
      <nav className="bg-slate-950/80 backdrop-blur border-b border-slate-800/80 px-6 py-4 fixed top-0 w-full z-40 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={fetchCatalogue}>
            <div className="bg-gradient-to-tr from-amber-400 to-indigo-500 p-2 rounded-xl text-black font-extrabold text-lg">Peblo TV</div>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">For Kids</span>
          </div>
          <div className="hidden md:flex gap-6 text-sm font-medium text-slate-300">
            <button onClick={fetchCatalogue} className="hover:text-white transition">Home</button>
            <button className="hover:text-white transition">Animated Stories</button>
            <button className="hover:text-white transition">Learning Universe</button>
          </div>
        </div>

        {/* Search & Language Bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">🌐 All Languages</option>
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
          </select>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shows, episodes..."
            className="bg-slate-900 border border-slate-800 text-xs text-white rounded-lg px-3 py-2 w-40 md:w-60 focus:outline-none focus:border-indigo-500"
          />
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition">
            Search
          </button>
        </form>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 pt-20 pb-16">
        {/* Featured Hero Banner */}
        {heroShow && !searchQuery && (
          <div className="relative w-full h-[450px] md:h-[520px] bg-slate-900 overflow-hidden mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10"></div>
            
            {/* Banner Artwork Preview */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-40 filter blur-sm scale-105"
              style={{
                backgroundImage: heroShow.banner_url ? `url(${API_BASE}${heroShow.banner_url})` : `url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80)`
              }}
            ></div>

            <div className="relative z-20 max-w-7xl mx-auto px-6 h-full flex flex-col justify-end pb-12">
              <span className="bg-amber-500/20 text-amber-300 text-xs px-3 py-1 rounded-full w-fit font-bold border border-amber-500/30 uppercase tracking-wider mb-3">
                Featured Kid Show • {heroShow.category}
              </span>
              <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">
                {heroShow.title}
              </h1>
              <p className="text-sm md:text-base text-slate-300 max-w-2xl mb-6 line-clamp-3 leading-relaxed">
                {heroShow.description}
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedShow(heroShow)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 transition"
                >
                  ▶ Watch Episodes
                </button>
                {heroShow.trailers?.length > 0 && (
                  <button
                    onClick={() => setSelectedShow(heroShow)}
                    className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold px-5 py-3 rounded-xl border border-slate-700 flex items-center gap-2 transition"
                  >
                    🎬 Watch Trailer
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Section Rows (Netflix-Style Horizontal Scroll) */}
        <div className="max-w-7xl mx-auto px-6 space-y-10">
          {catalogue?.sections?.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-4">
              <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                <span className="w-1.5 h-5 bg-indigo-500 rounded-full"></span>
                {sec.section_name}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {sec.shows.map((show) => (
                  <div
                    key={show.id}
                    onClick={() => setSelectedShow(show)}
                    className="group bg-slate-900 rounded-xl overflow-hidden border border-slate-800/80 hover:border-indigo-500/50 transition cursor-pointer transform hover:-translate-y-1 shadow-md hover:shadow-xl"
                  >
                    {/* Poster Artwork (2:3 Aspect Ratio) */}
                    <div className="aspect-[2/3] bg-slate-800 relative overflow-hidden">
                      <div 
                        className="w-full h-full bg-cover bg-center group-hover:scale-105 transition duration-300"
                        style={{
                          backgroundImage: show.poster_url ? `url(${API_BASE}${show.poster_url})` : `url(https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80)`
                        }}
                      ></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
                      <span className="absolute bottom-2 left-2 text-[10px] bg-slate-950/80 text-slate-300 px-2 py-0.5 rounded backdrop-blur font-medium">
                        {show.category}
                      </span>
                    </div>

                    <div className="p-3">
                      <h3 className="font-bold text-sm text-white truncate group-hover:text-indigo-400 transition">
                        {show.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                        {show.seasons?.length || 0} Season(s) • {show.trailers?.length || 0} Trailer
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Show Detail Modal */}
      {selectedShow && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl relative my-8">
            <button
              onClick={() => { setSelectedShow(null); setSelectedEpisode(null); }}
              className="absolute top-4 right-4 bg-slate-800 text-slate-300 hover:text-white p-2 rounded-full z-10"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="p-6 bg-slate-950 border-b border-slate-800">
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">{selectedShow.category}</span>
              <h2 className="text-2xl font-bold text-white mt-1">{selectedShow.title}</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{selectedShow.description}</p>
            </div>

            {/* Season 0 Trailers Section */}
            {selectedShow.trailers?.length > 0 && (
              <div className="p-6 bg-amber-950/20 border-b border-slate-800">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  🎬 Season 0 — Teasers & Trailers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedShow.trailers.map((tr, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-amber-900/40 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-semibold text-white">{tr.title}</div>
                        <div className="text-[10px] text-slate-400">{tr.duration_seconds}s • {tr.languages?.join(", ").toUpperCase()}</div>
                      </div>
                      <button
                        onClick={() => { setSelectedEpisode(tr); setActiveLangVariant(tr.languages[0]); }}
                        className="bg-amber-600 hover:bg-amber-500 text-black font-bold px-3 py-1 rounded text-[11px]"
                      >
                        Play Teaser
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Seasons & Episodes */}
            <div className="p-6 space-y-6">
              {selectedShow.seasons?.map((season) => (
                <div key={season.season_number} className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-1">
                    Season {season.season_number}: {season.title}
                  </h3>

                  <div className="grid grid-cols-1 gap-2">
                    {season.episodes.map((ep, epIdx) => (
                      <div
                        key={epIdx}
                        className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center hover:border-slate-700 transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-indigo-400">Ep {ep.episode_number}</span>
                            <span className="font-semibold text-sm text-white">{ep.title}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{ep.synopsis}</p>
                          
                          {/* Language Variant Collapse Pill */}
                          <div className="flex gap-1.5 mt-2">
                            {ep.languages?.map((lang) => (
                              <span key={lang} className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                                🌐 {lang.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => { setSelectedEpisode(ep); setActiveLangVariant(ep.languages[0]); }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-lg"
                        >
                          ▶ Watch
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Video Player Modal Overlay */}
            {selectedEpisode && (
              <div className="absolute inset-0 bg-slate-950 p-6 flex flex-col justify-between z-20">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="font-bold text-lg text-white">{selectedEpisode.title}</h3>
                    <p className="text-xs text-slate-400">Playing Episode Variant</p>
                  </div>
                  <button onClick={() => setSelectedEpisode(null)} className="text-slate-400 hover:text-white text-xs">✕ Close Player</button>
                </div>

                {/* Player Simulation */}
                <div className="my-auto bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4">
                  <div className="text-4xl">🎬 📺</div>
                  <h4 className="text-base font-semibold text-indigo-300">
                    Peblo Player Streaming — [{activeLangVariant.toUpperCase()} Audio Track]
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {selectedEpisode.synopsis}
                  </p>

                  {/* Multi-Language Audio Switcher */}
                  <div className="pt-4 flex justify-center gap-2">
                    <span className="text-xs text-slate-400 self-center">Switch Audio Language:</span>
                    {selectedEpisode.languages?.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setActiveLangVariant(lang)}
                        className={`px-3 py-1 rounded text-xs font-semibold border transition ${activeLangVariant === lang ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400"}`}
                      >
                        {lang === "en" ? "English" : lang === "hi" ? "हिंदी (Hindi)" : lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-slate-500 text-center">Peblo TV Streaming Engine v1.0</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
