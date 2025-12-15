import { Environment, Stars, OrbitControls } from '@react-three/drei';
import { Rocket } from './Rocket';
import { LandingPad } from './LandingPad';
import { Terrain } from './Terrain';
import { Trajectory } from './Trajectory';
import { ThrustVectors } from './ThrustVectors';
import { useSimulationStore } from '../stores/simulationStore';

export function Scene() {
  const { trajectory, showTrajectory, showThrustVectors, playbackTime, params } =
    useSimulationStore();

  // Calculate current position based on playback time
  const currentIndex = Math.min(
    Math.floor(playbackTime),
    trajectory ? trajectory.positions.length - 1 : 0
  );
  const nextIndex = Math.min(currentIndex + 1, trajectory ? trajectory.positions.length - 1 : 0);
  const t = playbackTime - currentIndex;

  // Interpolate position
  let rocketPosition: [number, number, number] = params.p0;
  let thrustVector: [number, number, number] = [0, 0, 0];

  if (trajectory && trajectory.positions.length > 0) {
    const p1 = trajectory.positions[currentIndex];
    const p2 = trajectory.positions[nextIndex];
    rocketPosition = [
      p1[0] + t * (p2[0] - p1[0]),
      p1[1] + t * (p2[1] - p1[1]),
      p1[2] + t * (p2[2] - p1[2]),
    ];

    if (currentIndex < trajectory.thrusts.length) {
      thrustVector = trajectory.thrusts[currentIndex];
    }
  }

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[50, 100, 50]} intensity={1} castShadow />
      <pointLight position={[-50, 50, -50]} intensity={0.5} color="#ff9966" />

      {/* Environment */}
      <Stars radius={500} depth={100} count={5000} factor={4} fade speed={1} />
      <Environment preset="night" />

      {/* Camera controls */}
      <OrbitControls
        makeDefault
        minDistance={50}
        maxDistance={2000}
        target={[0, 0, 200]}
      />

      {/* Scene objects */}
      <Terrain />
      <LandingPad position={params.p_target} />
      <Rocket position={rocketPosition} thrust={thrustVector} />

      {/* Visualization overlays */}
      {showTrajectory && trajectory && (
        <Trajectory positions={trajectory.positions} currentIndex={currentIndex} />
      )}
      {showThrustVectors && trajectory && (
        <ThrustVectors
          positions={trajectory.positions}
          thrusts={trajectory.thrusts}
          currentIndex={currentIndex}
        />
      )}
    </>
  );
}
