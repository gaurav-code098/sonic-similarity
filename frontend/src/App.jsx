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
  const API_BASE = "https://gaurav-code098-sonic-backend-api.hf.space";
  console.log("🚀 DEBUG: My API URL is:", API_BASE);

  // Memoize background
  const backgroundLayer = useMemo(() => <Background3D />, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;

    audioRef.current.pause();
    setPlayingId(null);
    setLoading(true);
    setData(null);

    try {
      const res = await axios.post(`${API_BASE}/scan`, { query });
      setData(res.data);
    } catch (err) {
      console.error(err);
      alert("Backend Error: " + (err.response?.data?.detail || "Is the server running?"));
    }
    setLoading(false);
  };

  const togglePlay = (song) => {
    if (playingId === song.id) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }

    if (!song.preview_url) {
      alert("No preview audio available for this track.");
      return;
    }

    try {
      audioRef.current.src = song.preview_url;
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(e => console.error("Playback failed:", e));
      setPlayingId(song.id);
    } catch (e) {
      console.error("Audio Error:", e);
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-cyan-500/30 font-sans text-zinc-200">
      
      {backgroundLayer}

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 flex flex-col items-center">
        
        {/* --- HEADER --- */}
        <div className="text-center mb-16 space-y-6 w-full max-w-screen-xl px-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/10 bg-cyan-950/10 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
            </span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-500/60 uppercase">
              V2.5 // iTunes Neural Engine
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-[0.1em] uppercase bg-clip-text text-transparent bg-gradient-to-b from-white via-zinc-400 to-zinc-800 whitespace-nowrap pb-4 pr-2 leading-normal drop-shadow-2xl">
            Sonic Similarity
          </h1>

          <div className="flex flex-col items-center gap-2 font-light tracking-wide text-xs md:text-base -mt-2">
            <p className="text-zinc-400 drop-shadow-md text-center px-4">
              Real-time Audio Signal Processing & Vector Analysis
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
              placeholder="Enter track identifier (e.g. 'Redrum 21 Savage')..." 
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

        {/* --- LOADING --- */}
        {loading && (
           <div className="flex flex-col items-center animate-pulse mb-20 space-y-6">
             <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse"></div>
                <Activity className="relative w-16 h-16 text-cyan-500/50 animate-bounce-slow" strokeWidth={1} />
             </div>
             <div className="text-center space-y-1">
               <p className="text-cyan-500 font-mono text-xs tracking-[0.2em] uppercase"> downloading audio stream </p>
               <p className="text-zinc-600 text-[10px] tracking-widest uppercase"> calculating spectral mfcc vectors </p>
             </div>
           </div>
        )}

        {/* --- RESULTS --- */}
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
                    onClick={() => togglePlay(song)}
                    className={`
                      group relative flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all duration-500
                      ${playingId === song.id 
                        ? 'bg-cyan-950/10 border-cyan-500/20' 
                        : 'bg-transparent border-transparent hover:bg-zinc-900/20 hover:border-white/5'}
                    `}
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-white/10 group-hover:border-white/30 transition-all">
                        {song.image ? (
                           <img src={song.image} alt={song.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        ) : (
                           <div className="w-full h-full bg-zinc-900" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                           {playingId === song.id ? <Pause size={16} className="text-cyan-400" fill="currentColor" /> : <Play size={16} className="text-white" fill="currentColor" />}
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className={`text-base tracking-wide truncate ${song.isSeed ? 'text-cyan-400 font-medium' : 'text-zinc-200 font-light'}`}>
                          {song.name}
                        </span>
                        <span className="text-xs text-zinc-500 truncate">{song.artist}</span>
                        {song.isSeed && <span className="text-[9px] text-cyan-500/50 uppercase tracking-widest mt-1">Input Signal</span>}
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

            {/* --- MAP VIEW (FIXED ALIGNMENT) --- */}
            <div className="w-full relative px-4 mt-20 mb-32 flex justify-center">
               
               {/* Container: Centered, Fixed Height, Max Width */}
               <div className="w-full max-w-5xl h-[600px] border border-white/5 rounded-3xl bg-black/20 overflow-hidden relative shadow-2xl shadow-black/50 flex items-center justify-center">
                   
                   {/* Label */}
                   <div className="absolute top-6 left-0 right-0 flex justify-center z-10 pointer-events-none">
                      <span className="text-[10px] uppercase tracking-[0.3em] text-cyan-400 font-bold bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                        Projection Matrix
                      </span>
                   </div>

                   {/* Canvas Wrapper */}
                   <div className="w-full h-full absolute inset-0 z-0">
                       <SonicMap data={data.matches} />
                   </div>
                   
                   {/* Grid Background */}
                   <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
               </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}