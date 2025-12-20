import React, { useMemo, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Html, 
  Grid, 
  Line, 
  PerspectiveCamera, 
  Stars, 
  Environment
} from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// --- UTILS: COLOR PALETTE ---
const COLORS = {
  seed: '#f59e0b', // Amber
  match: '#06b6d4', // Cyan
  hover: '#ffffff',
  lineIdle: '#334155', // Slate-700
  lineActive: '#22d3ee' // Bright Cyan
};

// --- SUB-COMPONENT: CONNECTION LINE ---
const ConnectionLine = ({ start, end, isHovered }) => {
  const ref = useRef();
  
  return (
    <Line
      ref={ref}
      points={[start, end]}
      color={isHovered ? COLORS.lineActive : COLORS.lineIdle}
      lineWidth={isHovered ? 1.5 : 1} 
      transparent
      opacity={isHovered ? 1.0 : 0.25}
      depthWrite={false}
    />
  );
};

// --- SUB-COMPONENT: SONG NODE ---
const SongNode = ({ song, position, isHovered, setHoveredId }) => {
  const meshRef = useRef();
  const isSeed = song.isSeed;
  
  const color = isSeed ? COLORS.seed : COLORS.match;
  const size = isSeed ? 1.5 : 0.8;
  
  useFrame((state, delta) => {
    if(meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.rotation.x += delta * 0.2;
    }
  });

  return (
    <group position={position}>
      
      {/* rotating orb */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[size, 1]} /> 
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={isHovered ? 3 : (isSeed ? 2 : 1.2)}
          wireframe={isHovered} 
          toneMapped={false}
        />
        {!isHovered && <meshBasicMaterial color={color} toneMapped={false} />}
      </mesh>

      {/* invisible larger hover hitbox */}
      <mesh 
        visible={false} 
        onPointerOver={(e) => { 
          e.stopPropagation(); 
          setHoveredId(song.id); 
          document.body.style.cursor = 'pointer'; 
        }}
        onPointerOut={() => { 
          setHoveredId(null); 
          document.body.style.cursor = 'auto'; 
        }}
      >
        <sphereGeometry args={[size * 4, 16, 16]} /> 
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* hover tooltip */}
      {isHovered && (
        <Html center zIndexRange={[100, 0]} style={{ pointerEvents:"none" }}>
          <div className="flex flex-col items-center justify-end pb-10"> 

            {/* SMALLER TOOLTIP CARD */}
            <div className={`
              w-[160px] md:w-[210px]
              p-2 rounded-[14px] backdrop-blur-xl border-[2px] shadow-[0_6px_20px_rgba(0,0,0,0.6)]
              flex flex-col gap-1.5 transform origin-bottom animate-in zoom-in-90 duration-200
              ${isSeed ? "bg-amber-950/90 border-amber-500" : "bg-cyan-950/90 border-cyan-500"}
            `}>
              
              {/* header */}
              <div className="flex flex-col gap-0.5">
                <span className={`text-[8px] md:text-[10px] font-bold tracking-[0.12em] uppercase opacity-80 ${isSeed ? "text-amber-300" : "text-cyan-300"}`}>
                  {isSeed ? "Input Source" : "Artist"}
                </span>
                <span className={`text-sm md:text-base font-bold truncate ${isSeed ? "text-amber-100" : "text-cyan-100"}`}>
                  {isSeed ? "Original Track" : song.artist}
                </span>
              </div>

              <div className={`h-[1px] w-full ${isSeed ? "bg-amber-500/50" : "bg-cyan-500/50"}`}></div>

              <h4 className="text-white font-black text-lg md:text-xl leading-tight drop-shadow-md line-clamp-2">
                {song.name}
              </h4>

              {!isSeed && song.score && (
                <div className="absolute -top-4 -right-3 bg-black/80 backdrop-blur-md border border-cyan-500/50 rounded-md px-1.5 py-1 shadow-lg">
                  <div className="flex flex-col items-center leading-none">
                    <span className="text-[8px] font-bold text-cyan-500 tracking-wider mb-0.5">MATCH</span>
                    <span className="text-xl md:text-2xl font-black text-cyan-400 font-mono">
                      {Math.round(song.score)}<span className="text-xs">%</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className={`w-[2px] h-5 ${isSeed ? "bg-amber-500" : "bg-cyan-500"} shadow-[0_0_10px_currentColor]`}></div>
          </div>
        </Html>
      )}
      
    </group>
  );
};

// --- MAIN COMPONENT SAME ---
const SonicMap = ({ data }) => {
  const [hoveredId, setHoveredId] = useState(null);

  const { normalizedData, seedPosition } = useMemo(() => {
    if (!data || data.length === 0) return { normalizedData: [], seedPosition: [0,0,0] };

    const seed = data.find(d => d.isSeed) || data[0];
    const seedX = parseFloat(seed.x) || 0;
    const seedY = parseFloat(seed.y) || 0;

    let maxDist = 0;
    const shifted = data.map(d => {
      const dx = (parseFloat(d.x) || 0) - seedX;
      const dy = (parseFloat(d.y) || 0) - seedY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist > maxDist) maxDist = dist;
      return { ...d, dx, dy };
    });

    const TARGET_RADIUS = 35;
    const scale = maxDist > 0 ? TARGET_RADIUS / maxDist : 1;

    const finalData = shifted.map(d => ({
      ...d,
      renderPos: [d.dx * scale, 3, d.dy * scale] 
    }));

    return { 
      normalizedData: finalData, 
      seedPosition: [0, 3, 0] 
    };
  }, [data]);

  if (!normalizedData.length) return null;

  return (
    <Canvas className="w-full h-full block" dpr={[1, 2]} gl={{ antialias: true }}>
      <PerspectiveCamera makeDefault position={[0, 40, 70]} fov={50} onUpdate={c => c.lookAt(0, 0, 0)} />
      
      <Environment preset="night" />
      <Stars radius={200} depth={50} count={3000} factor={6} saturation={0} fade speed={0.2} />
      <fog attach="fog" args={['#020617', 20, 160]} />

      <ambientLight intensity={0.2} />
      <pointLight position={[0, 50, 0]} intensity={3} />
      <pointLight position={[50, 20, 50]} intensity={2} />
      <pointLight position={[-50, 20, -50]} intensity={2} />

      <group>
        <Grid args={[600, 600]} position={[0,0,0]} cellSize={5} cellThickness={0.7}
          cellColor="#0f172a" sectionSize={25} sectionThickness={1.5} sectionColor="#1e293b"
          fadeDistance={130} infiniteGrid />

        {normalizedData.map((song, i) => {
          if (song.isSeed) return null;  
          return (
            <ConnectionLine 
              key={`line-${i}`} 
              start={seedPosition} 
              end={song.renderPos} 
              isHovered={hoveredId === song.id}
            />
          );
        })}

        {normalizedData.map((song) => (
          <SongNode 
            key={song.id} 
            song={song} 
            position={song.renderPos}
            isHovered={hoveredId === song.id} 
            setHoveredId={setHoveredId}
          />
        ))}
      </group>

      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.1} mipmapBlur intensity={1.5} radius={0.6} />
      </EffectComposer>

      <OrbitControls 
        enablePan 
        minDistance={20} 
        maxDistance={110} 
        maxPolarAngle={Math.PI / 2.05}
        autoRotate={!hoveredId}
        autoRotateSpeed={0.2}
      />
    </Canvas>
  );
};

export default SonicMap;
