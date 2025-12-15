import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { ControlPanel } from './ui/ControlPanel';
import { Telemetry } from './ui/Telemetry';
import { CameraSwitcher } from './ui/CameraSwitcher';
import { MarsLocationOverlay } from './ui/MarsLocationOverlay';
import { useSimulationStore } from './stores/simulationStore';
import { useCameraStore, type CameraMode } from './stores/cameraStore';
import { stepPhysics } from './simulation/PhysicsEngine';

function App() {
  const {
    status,
    playbackTime,
    playbackSpeed,
    trajectory,
    setPlaybackTime,
    setStatus,
    // Simple physics mode
    simulationMode,
    simplePhysics,
    setSimplePhysics,
  } = useSimulationStore();

  const { startTransition } = useCameraStore();
  const lastTimeRef = useRef<number>(0);

  // Keyboard shortcuts for camera switching
  useEffect(() => {
    const keyToCameraMap: Record<string, CameraMode> = {
      '1': 'orbit',
      '2': 'chase',
      '3': 'ground',
      '4': 'tracking',
      '5': 'engine',
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      const camera = keyToCameraMap[e.key];
      if (camera) {
        startTransition(camera);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startTransition]);

  // Landing playback animation with crash detection
  useEffect(() => {
    if (status !== 'playing' || !trajectory) return;

    let animationId: number;
    const maxTime = trajectory.positions.length - 1;
    const SAFE_LANDING_VELOCITY = 10; // m/s - above this is a crash
    const GROUND_ALTITUDE = 30; // Check crash when below this altitude

    const animate = (currentTime: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }

      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      const newTime = playbackTime + deltaTime * playbackSpeed;
      const currentIndex = Math.floor(newTime);

      // Check for crash: if near ground with high velocity
      if (currentIndex < trajectory.positions.length && currentIndex < trajectory.velocities.length) {
        const pos = trajectory.positions[currentIndex];
        const vel = trajectory.velocities[currentIndex];
        const altitude = pos[2]; // z is altitude in physics coords
        const verticalVelocity = Math.abs(vel[2]);
        const totalVelocity = Math.sqrt(vel[0] ** 2 + vel[1] ** 2 + vel[2] ** 2);

        // Crash if low altitude and high velocity
        if (altitude < GROUND_ALTITUDE && totalVelocity > SAFE_LANDING_VELOCITY) {
          setPlaybackTime(newTime);
          setStatus('crashed');
          return;
        }
      }

      if (newTime >= maxTime) {
        // Final check: did we land safely?
        const finalVel = trajectory.velocities[trajectory.velocities.length - 1];
        const finalSpeed = Math.sqrt(finalVel[0] ** 2 + finalVel[1] ** 2 + finalVel[2] ** 2);
        if (finalSpeed > SAFE_LANDING_VELOCITY) {
          setStatus('crashed');
        } else {
          setStatus('landed');
        }
        setPlaybackTime(maxTime);
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

  // Simple physics animation loop
  useEffect(() => {
    if (status !== 'simpleRunning') return;

    let animationId: number;

    const animate = (currentTime: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }

      const deltaTime = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = currentTime;

      // Get latest state from store to avoid stale closure
      const currentPhysics = useSimulationStore.getState().simplePhysics;
      const currentConfig = useSimulationStore.getState().simpleConfig;

      const newPhysics = stepPhysics(currentPhysics, currentConfig, deltaTime, 0);
      setSimplePhysics(newPhysics);

      if (newPhysics.hasCrashed) {
        setStatus('crashed');
      } else if (newPhysics.hasLandedSafely) {
        setStatus('landed');
      } else {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      lastTimeRef.current = 0;
    };
  }, [status, setSimplePhysics, setStatus]);

  // Get display time for mission clock
  const displayTime = simulationMode === 'simple'
    ? simplePhysics.elapsedTime
    : playbackTime;

  return (
    <div className="w-full h-full bg-[#050608] hex-grid scanlines relative">
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{
          position: [500, 300, 800],
          fov: 60,
          near: 1,
          far: 8000,
        }}
        gl={{ antialias: true }}
      >
        <Scene />
      </Canvas>

      {/* UI Overlays */}
      <ControlPanel />
      <Telemetry />
      {/* Camera switcher hidden - use mouse to rotate view */}
      {/* <CameraSwitcher /> */}
      <MarsLocationOverlay />

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
            {simulationMode === 'simple' ? 'Newtonian Physics' : 'Mars Powered Descent'}
          </p>
          <p className="text-[9px] text-cyan-500/40 mt-1 tracking-wider">
            {simulationMode === 'simple'
              ? 'Simple rocket simulation'
              : <>G-FOLD via <span className="text-cyan-500/60">cvxjs</span></>}
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
            T{displayTime >= 0 ? '+' : ''}{displayTime.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Phase indicator */}
      {(status === 'simpleRunning' || status === 'crashed' || status === 'landed') && simulationMode === 'simple' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2">
          <div className="mission-panel rounded px-4 py-1">
            <span className={`text-xs uppercase tracking-wider ${
              status === 'crashed' ? 'text-red-400' :
              status === 'landed' ? 'text-green-400' :
              simplePhysics.isEngineOn ? 'text-orange-400' : 'text-cyan-400'
            }`}>
              {status === 'crashed' ? 'CRASH!' :
               status === 'landed' ? 'LANDED!' :
               simplePhysics.isEngineOn ? 'Engine Burn' : 'Freefall'}
            </span>
          </div>
        </div>
      )}

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
          G-FOLD Algorithm • Mars Landing
        </p>
        <p className="text-[8px] text-amber-500/30 mt-0.5">
          Convex Optimization for Powered Descent
        </p>
      </div>
    </div>
  );
}

export default App;
