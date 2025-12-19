import React, { useState, useRef, useMemo } from 'react';
import axios from 'axios';
import Background3D from './Visuals';
import SonicMap from './SonicMap';
import { Search, Play, Pause, Disc, Activity } from 'lucide-react';

export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  
  // Audio State
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(new Audio());

  // --- CONFIGURATION ---
  // ✅ FIXED: Points directly to your Hugging Face Backend


  const API_BASE = "https://gaurav-code098-sonic-backend-api.hf.space";
  
  // ADD THIS LINE:
  console.log("🚀 DEBUG: My API URL is:", API_BASE);
  // ---------------------

  const backgroundLayer = useMemo(() => <Background3D />, []);

  // --- TITLE CLEANER FUNCTION ---
  const cleanTitle = (rawTitle) => {
    return rawTitle
      .replace(/\(.*?lyrics.*?\)/gi, "")
      .replace(/\[.*?lyrics.*?\]/gi, "")
      .replace(/\(.*?official.*?\)/gi, "")
      .replace(/\[.*?official.*?\]/gi, "")
      .replace(/\(.*?video.*?\)/gi, "")
      .replace(/\(.*?audio.*?\)/gi, "")
      .replace(/\[.*?4k.*?\]/gi, "")
      .replace(/\[.*?hd.*?\]/gi, "")
      .replace(/- Topic/g, "")
      .replace(/\s\s+/g, " ")
      .trim();
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;

    audioRef.current.pause();
    setPlayingId(null);
    setLoading(true);
    setData(null);

    try {
      // ✅ FIXED: Used API_BASE instead of BASE_URL
      const res = await axios.post(`${API_BASE}/scan`, { query });
      setData(res.data);
    } catch (err) {
      console.error(err);
      alert("Could not connect to the Backend. Is the Python server running?");
    }
    setLoading(false);
  };

  const togglePlay = (filename, id) => {
    if (playingId === id) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      // ✅ FIXED: Used API_BASE instead of BASE_URL
      const url = `${API_BASE}/songs/${encodeURIComponent(filename)}`;
      audioRef.current.src = url;
      audioRef.current.play().catch(e => console.log("Playback error:", e));
      setPlayingId(id);
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-cyan-500/30 font-sans text-zinc-200">
      
      {backgroundLayer}

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 flex flex-col items-center">
        
        {/* --- HEADER --- */}
        <div className="text-center mb-16 space-y-6 w-full max-w-screen-xl px-2 overflow-visible">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/10 bg-cyan-950/10 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
            </span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-500/60 uppercase">
              V2.0 // Neural Engine
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-[0.1em] uppercase bg-clip-text text-transparent bg-gradient-to-b from-white via-zinc-400 to-zinc-800 whitespace-nowrap pb-4 pr-2 leading-normal drop-shadow-2xl">
            Sonic Similarity
          </h1>

          <div className="flex flex-col items-center gap-2 font-light tracking-wide text-xs md:text-base -mt-2">
            <p className="text-zinc-400 drop-shadow-md text-center px-4">
              High-dimensional audio vector analysis.
            </p>
            <p className="text-zinc-500 text-[10px] tracking-widest uppercase font-semibold opacity-100">
              Extracting sonic DNA from raw waveforms
            </p>
          </div>
        </div>

        {/* --- SEARCH BAR --- */}
        <form onSubmit={handleSearch} className="w-full max-w-2xl mb-24 relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000" />
          <div className="relative flex items-center bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl p-1.5 transition-all duration-300 focus-within:bg-black/40 focus-within:border-white/10">
            <div className="pl-4 pr-2 text-zinc-600 group-focus-within:text-zinc-400 transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter track identifier..." 
              className="w-full bg-transparent border-none outline-none text-white text-lg placeholder-zinc-700 font-light tracking-wide h-12"
            />
            <button 
              disabled={loading}
              className="h-10 px-6 rounded-xl bg-white/5 text-zinc-400 text-[10px] font-bold tracking-widest uppercase border border-white/5 hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed"
            >
              {loading ? <span className="animate-pulse">...</span> : "Analyze"}
            </button>
          </div>
        </form>

        {/* --- LOADING STATE --- */}
        {loading && (
           <div className="flex flex-col items-center animate-pulse mb-20 space-y-6">
             <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse"></div>
                <Activity className="relative w-16 h-16 text-cyan-500/50 animate-bounce-slow" strokeWidth={1} />
             </div>
             <div className="text-center space-y-1">
               <p className="text-cyan-500 font-mono text-xs tracking-[0.2em] uppercase"> accessing neural audio stream </p>
               <p className="text-zinc-600 text-[10px] tracking-widest uppercase"> processing spectral centroids </p>
             </div>
           </div>
        )}

        {/* --- RESULTS AREA --- */}
        {data && (
          <div className="w-full animate-fade-in-up">
            
            {/* LIST VIEW */}
            <div className="max-w-3xl mx-auto mb-32">
              <div className="flex items-end justify-between mb-8 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-zinc-900/50 rounded-lg border border-white/5">
                      <Disc className="w-4 h-4 text-cyan-500" />
                   </div>
                   <div>
                     <h3 className="text-lg font-medium text-white tracking-wide">Sonic Matches</h3>
                     <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Cosine Similarity Index</p>
                   </div>
                </div>
              </div>

              <div className="space-y-2">
                {data.matches.map((song, i) => (
                  <div 
                    key={i}
                    onClick={() => togglePlay(song.filename, song.id)}
                    className={`
                      group relative flex items-center justify-between px-6 py-4 rounded-xl border cursor-pointer transition-all duration-500
                      ${playingId === song.id 
                        ? 'bg-cyan-950/10 border-cyan-500/20' 
                        : 'bg-transparent border-transparent hover:bg-zinc-900/20 hover:border-white/5'}
                    `}
                  >
                    <div className="flex items-center gap-6 overflow-hidden">
                      <button className={`
                        w-10 h-10 shrink-0 rounded-full flex items-center justify-center border transition-all duration-300
                        ${playingId === song.id 
                           ? 'bg-cyan-400 border-cyan-400 text-black scale-110 shadow-[0_0_15px_rgba(34,211,238,0.4)]' 
                           : 'bg-transparent border-zinc-800 text-zinc-600 group-hover:border-zinc-600 group-hover:text-zinc-400'}
                      `}>
                        {playingId === song.id ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                      </button>
                      
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className={`text-base tracking-wide truncate ${song.isSeed ? 'text-cyan-400 font-medium' : 'text-zinc-300 font-light'}`}>
                          {cleanTitle(song.name)}
                        </span>
                        {song.isSeed && <span className="text-[9px] text-cyan-500/50 uppercase tracking-widest border border-cyan-500/10 rounded px-1.5 py-0.5 w-fit">Input Signal</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pl-4 shrink-0">
                       <div className="h-8 w-[1px] bg-white/5"></div>
                       <span className="text-xl font-light text-zinc-600 font-mono group-hover:text-zinc-400 transition-colors">
                         {song.score}<span className="text-xs align-top opacity-50">%</span>
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MAP VIEW */}
            <div className="w-full relative px-4">
               <div className="absolute left-1/2 -translate-x-1/2 -top-16 flex flex-col items-center">
                  <div className="w-[1px] h-12 bg-gradient-to-b from-transparent to-cyan-500/50"></div>
                  <span className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-bold mt-3 shadow-cyan-500/50 drop-shadow-md">
                    Projection Matrix
                  </span>
               </div>
               <SonicMap data={data.matches} />
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
