import React from 'react';
import { motion } from 'framer-motion';

export default function SonicMap({ data }) {
  if (!data || data.length === 0) return null;

  const seed = data.find(s => s.isSeed) || data[0];
  const matches = data.filter(s => !s.isSeed);

  return (
    // FIX: Completely transparent container, no borders, no background
    <div className="relative w-full max-w-7xl mx-auto h-[600px] select-none">
      
      {/* Background Grid (Very faint, blends with main BG) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />
      
      {/* Subtle Center Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.05),transparent_60%)] pointer-events-none" />

      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {matches.map((song, i) => (
          <motion.line
            key={`line-${i}`}
            x1={`${seed.x}%`} y1={`${seed.y}%`}
            x2={`${song.x}%`} y2={`${song.y}%`}
            stroke="#22d3ee"
            strokeWidth="1"
            strokeOpacity="0.2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.2 }}
            transition={{ duration: 1.5, delay: 0.5 + (i * 0.05), ease: "easeInOut" }}
          />
        ))}
      </svg>

      {/* Nodes */}
      {data.map((song, i) => (
        <motion.div
          key={song.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 * i }}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 group"
          style={{ left: `${song.x}%`, top: `${song.y}%` }}
        >
          {/* The Dot */}
          <div className={`
            rounded-full transition-all duration-500 border relative
            ${song.isSeed 
              ? 'w-6 h-6 bg-orange-500 border-orange-300 shadow-[0_0_30px_rgba(249,115,22,0.6)] z-20' 
              : 'w-3 h-3 bg-cyan-950 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)] group-hover:scale-150 group-hover:bg-cyan-400 group-hover:border-white group-hover:shadow-[0_0_20px_rgba(34,211,238,0.8)] cursor-pointer'}
          `}>
             {song.isSeed && <div className="absolute -inset-4 bg-orange-500/20 rounded-full animate-pulse -z-10"></div>}
          </div>

          {/* Tooltip (Only Visible on Hover) */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
            <div className="bg-black/80 backdrop-blur-md border border-white/10 px-3 py-2 rounded-lg text-center whitespace-nowrap shadow-2xl transform translate-y-1 group-hover:translate-y-0 transition-transform">
              <p className="text-xs font-bold text-white tracking-wide">{song.name}</p>
              {!song.isSeed && <p className="text-[9px] text-cyan-400 font-mono mt-0.5">{song.score}% Similarity</p>}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}