import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { ControlPanel } from './ui/ControlPanel';
import { Telemetry } from './ui/Telemetry';
import { useSimulationStore } from './stores/simulationStore';

function App() {
  const { status, playbackTime, playbackSpeed, trajectory, setPlaybackTime, setStatus } =
    useSimulationStore();

  const lastTimeRef = useRef<number>(0);

  // Animation loop for playback
  useEffect(() => {
    if (status !== 'playing' || !trajectory) return;

    let animationId: number;
    const maxTime = trajectory.positions.length - 1;

    const animate = (currentTime: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }

      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      const newTime = playbackTime + deltaTime * playbackSpeed;

      if (newTime >= maxTime) {
        setPlaybackTime(maxTime);
        setStatus('paused');
      } else {
        setPlaybackTime(newTime);
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      lastTimeRef.current = 0;
    };
  }, [status, playbackTime, playbackSpeed, trajectory, setPlaybackTime, setStatus]);

  return (
    <div className="w-full h-full bg-[#050608] hex-grid scanlines relative">
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{
          position: [500, 300, 800],
          fov: 60,
          near: 1,
          far: 5000,
        }}
        gl={{ antialias: true }}
      >
        <Scene />
      </Canvas>

      {/* UI Overlays */}
      <ControlPanel />
      <Telemetry />

      {/* Title Header */}
      <div className="absolute top-4 right-4 text-right">
        <div className="mission-panel rounded-lg px-5 py-4">
          <div className="corner-decoration corner-tl" />
          <div className="corner-decoration corner-tr" />
          <div className="corner-decoration corner-bl" />
          <div className="corner-decoration corner-br" />

          <h1 className="header-display text-xl glow-amber tracking-wider">
            CVXKERB-JS
          </h1>
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent my-2" />
          <p className="text-[10px] text-amber-500/50 tracking-[0.2em] uppercase">
            Fuel-Optimal Landing Guidance
          </p>
          <p className="text-[9px] text-cyan-500/40 mt-1 tracking-wider">
            Powered by <span className="text-cyan-500/60">cvxjs</span> SOCP Solver
          </p>
        </div>
      </div>

      {/* Mission Clock */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2">
        <div className="mission-panel rounded-lg px-6 py-2 flex items-center gap-4">
          <span className="text-[9px] text-amber-500/40 uppercase tracking-wider">
            Mission Time
          </span>
          <span className="header-display text-lg glow-amber tabular-nums">
            T{playbackTime >= 0 ? '+' : ''}{playbackTime.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Error display */}
      {status === 'error' && (
        <div className="absolute bottom-4 right-4 mission-panel rounded-lg px-4 py-3 border-red-500/50">
          <div className="flex items-center gap-2">
            <div className="status-dot status-error" />
            <span className="text-red-400 text-sm">
              {useSimulationStore.getState().errorMessage}
            </span>
          </div>
        </div>
      )}

      {/* Bottom credits */}
      <div className="absolute bottom-4 right-4 text-right opacity-40 hover:opacity-70 transition-opacity">
        <p className="text-[9px] text-amber-500/50 tracking-wider">
          G-FOLD Algorithm • SpaceX-inspired
        </p>
        <p className="text-[8px] text-amber-500/30 mt-0.5">
          Convex Optimization for Powered Descent
        </p>
      </div>
    </div>
  );
}

export default App;
