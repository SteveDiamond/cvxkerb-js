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
    <div className="w-full h-full bg-black">
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

      <ControlPanel />
      <Telemetry />

      {/* Title overlay */}
      <div className="absolute top-4 right-4 text-right">
        <h1 className="text-2xl font-bold text-white/80">cvxkerb-js</h1>
        <p className="text-sm text-gray-400">G-FOLD Powered Descent Guidance</p>
        <p className="text-xs text-gray-500 mt-1">Powered by cvxjs</p>
      </div>

      {/* Error display */}
      {status === 'error' && (
        <div className="absolute bottom-4 right-4 bg-red-900/80 text-red-200 px-4 py-2 rounded">
          {useSimulationStore.getState().errorMessage}
        </div>
      )}
    </div>
  );
}

export default App;
