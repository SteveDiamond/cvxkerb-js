import { useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { ControlPanel } from './ui/ControlPanel';
import { Telemetry } from './ui/Telemetry';
import { CameraSwitcher } from './ui/CameraSwitcher';
import { useSimulationStore } from './stores/simulationStore';
import { useCameraStore, type CameraMode } from './stores/cameraStore';
import { solveLanding } from './simulation/GFoldSolver';

function App() {
  const {
    status,
    params,
    playbackTime,
    playbackSpeed,
    trajectory,
    launchTime,
    launchPosition,
    launchVelocity,
    setPlaybackTime,
    setStatus,
    setLaunchTime,
    setLaunchState,
    setTrajectory,
    setErrorMessage,
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

  // Trigger G-FOLD solver and transition to landing
  const triggerLanding = useCallback(async () => {
    setStatus('solving');

    // Create landing params from current launch state
    const landingParams = {
      ...params,
      p0: launchPosition,
      v0: launchVelocity,
    };

    try {
      const result = await solveLanding(landingParams);
      setTrajectory(result);
      setStatus('playing');
      setPlaybackTime(0);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Solver failed');
    }
  }, [params, launchPosition, launchVelocity, setStatus, setTrajectory, setPlaybackTime, setErrorMessage]);

  // Launch phase animation
  useEffect(() => {
    if (status !== 'launching') return;

    let animationId: number;
    const gravity = params.g;
    const mass = params.m;
    const maxThrust = params.F_max;

    const animate = (currentTime: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }

      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      const newLaunchTime = launchTime + deltaTime * playbackSpeed;
      setLaunchTime(newLaunchTime);

      // Simple launch physics
      let thrust = 0;
      let [px, py, pz] = launchPosition;
      let [vx, vy, vz] = launchVelocity;

      if (newLaunchTime < 0) {
        // Countdown - engines starting
        thrust = newLaunchTime > -2 ? 0.3 : 0;
      } else if (newLaunchTime < 30) {
        // Ascent phase - full thrust, slight pitch over
        thrust = 1.0;
        const thrustAccel = (thrust * maxThrust) / mass;

        // Gravity turn - gradually pitch over
        const pitchAngle = Math.min(newLaunchTime * 0.02, 0.8); // Max ~45 deg
        const thrustZ = Math.cos(pitchAngle) * thrustAccel;
        const thrustX = Math.sin(pitchAngle) * thrustAccel * 0.5;

        vz += (thrustZ - gravity) * deltaTime;
        vx += thrustX * deltaTime;

        pz += vz * deltaTime;
        px += vx * deltaTime;
      } else if (newLaunchTime < 35) {
        // Coast / MECO
        thrust = 0;
        vz -= gravity * deltaTime;
        pz += vz * deltaTime;
        px += vx * deltaTime;
      } else {
        // Trigger landing sequence
        setLaunchState({ position: [px, py, pz], velocity: [vx, vy, vz], thrust: 0 });
        triggerLanding();
        return;
      }

      // Keep above ground
      if (pz < 5) {
        pz = 5;
        vz = Math.max(0, vz);
      }

      setLaunchState({ position: [px, py, pz], velocity: [vx, vy, vz], thrust });
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      lastTimeRef.current = 0;
    };
  }, [status, launchTime, launchPosition, launchVelocity, params, playbackSpeed, setLaunchTime, setLaunchState, triggerLanding]);

  // Landing playback animation
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

  // Get display time for mission clock
  const displayTime = status === 'launching' ? launchTime : playbackTime + (trajectory ? 35 : 0);

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
      <CameraSwitcher />

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
            Mars Powered Descent
          </p>
          <p className="text-[9px] text-cyan-500/40 mt-1 tracking-wider">
            G-FOLD via <span className="text-cyan-500/60">cvxjs</span>
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
      {status === 'launching' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2">
          <div className="mission-panel rounded px-4 py-1">
            <span className="text-xs text-cyan-400 uppercase tracking-wider">
              {launchTime < 0 ? 'Countdown' : launchTime < 30 ? 'Ascent' : 'MECO'}
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
