import { Stars, OrbitControls } from '@react-three/drei';
import { Rocket } from './Rocket';
import { Trajectory } from './Trajectory';
import { ThrustVectors } from './ThrustVectors';
import { GlideslopeCone } from './GlideslopeCone';
import { useSimulationStore } from '../stores/simulationStore';
import { useCameraStore } from '../stores/cameraStore';
import { EnvironmentManager } from './environments/EnvironmentManager';
import { CameraController } from './camera/CameraController';
import { LandingDust } from './effects/LandingDust';

export function Scene() {
  const {
    status,
    trajectory,
    showTrajectory,
    showThrustVectors,
    showGlideslopeCone,
    playbackTime,
    params,
    launchPosition,
    launchVelocity,
    launchThrust,
  } = useSimulationStore();
  const { activeCamera } = useCameraStore();

  // Calculate current position based on mode
  const currentIndex = Math.min(
    Math.floor(playbackTime),
    trajectory ? trajectory.positions.length - 1 : 0
  );
  const nextIndex = Math.min(currentIndex + 1, trajectory ? trajectory.positions.length - 1 : 0);
  const t = playbackTime - currentIndex;

  // Determine rocket state based on simulation status
  let rocketPosition: [number, number, number];
  let rocketVelocity: [number, number, number];
  let thrustVector: [number, number, number];

  if (status === 'launching') {
    // Use launch state
    rocketPosition = launchPosition;
    rocketVelocity = launchVelocity;
    // During launch, thrust is upward (with some pitch)
    const thrustMag = launchThrust * params.F_max;
    thrustVector = [thrustMag * 0.1, 0, thrustMag * 0.95];
  } else if (trajectory && trajectory.positions.length > 0) {
    // Use trajectory playback
    const p1 = trajectory.positions[currentIndex];
    const p2 = trajectory.positions[nextIndex];
    rocketPosition = [
      p1[0] + t * (p2[0] - p1[0]),
      p1[1] + t * (p2[1] - p1[1]),
      p1[2] + t * (p2[2] - p1[2]),
    ];

    rocketVelocity = currentIndex < trajectory.velocities.length
      ? trajectory.velocities[currentIndex]
      : params.v0;

    thrustVector = currentIndex < trajectory.thrusts.length
      ? trajectory.thrusts[currentIndex]
      : [0, 0, 0];
  } else {
    // Idle - rocket on pad
    rocketPosition = [0, 0, 5];
    rocketVelocity = [0, 0, 0];
    thrustVector = [0, 0, 0];
  }

  return (
    <>
      {/* Stars (visible in all environments) */}
      <Stars radius={500} depth={100} count={5000} factor={4} fade speed={1} />

      {/* Camera system */}
      {activeCamera === 'orbit' && (
        <OrbitControls
          makeDefault
          minDistance={50}
          maxDistance={2000}
          target={[0, 0, 200]}
        />
      )}
      <CameraController
        rocketPosition={rocketPosition}
        rocketVelocity={rocketVelocity}
        targetPosition={params.p_target}
      />

      {/* Environment (includes terrain, lighting, sky) */}
      <EnvironmentManager landingPadPosition={params.p_target} />

      {/* Rocket */}
      <Rocket position={rocketPosition} thrust={thrustVector} velocity={rocketVelocity} />

      {/* Landing dust effect */}
      <LandingDust
        rocketPosition={rocketPosition}
        thrustMagnitude={Math.sqrt(thrustVector[0] ** 2 + thrustVector[1] ** 2 + thrustVector[2] ** 2)}
        maxThrust={params.F_max}
      />

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

      {/* Glideslope cone visualization */}
      {showGlideslopeCone && (
        <GlideslopeCone
          targetPosition={params.p_target}
          maxAltitude={params.p0[2] * 1.2}
          alpha={params.alpha}
        />
      )}
    </>
  );
}
