import { OrbitControls, Stars } from '@react-three/drei';
import { Rocket } from './Rocket';
import { Trajectory } from './Trajectory';
import { ThrustVectors } from './ThrustVectors';
import { GlideslopeCone } from './GlideslopeCone';
import { useSimulationStore } from '../stores/simulationStore';
// Camera store used by CameraController
import { EnvironmentManager } from './environments/EnvironmentManager';
import { CameraController } from './camera/CameraController';
import { LandingDust } from './effects/LandingDust';
import { Explosion } from './effects/Explosion';

export function Scene() {
  const {
    status,
    trajectory,
    showTrajectory,
    showThrustVectors,
    showGlideslopeCone,
    playbackTime,
    params,
    // Simple physics mode
    simulationMode,
    simplePhysics,
    simpleConfig,
  } = useSimulationStore();

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

  // Simple physics mode
  // Physics uses [x, y, z] where z = altitude
  // Three.js uses [x, y, z] where y = up
  // So we need to swap y and z for rendering
  if (simulationMode === 'simple') {
    if (status === 'simpleRunning' || status === 'crashed' || status === 'landed') {
      // Swap: physics z (altitude) -> Three.js y (up)
      rocketPosition = [
        simplePhysics.position[0],
        simplePhysics.position[2],  // z -> y
        simplePhysics.position[1],  // y -> z
      ];
      rocketVelocity = [
        simplePhysics.velocity[0],
        simplePhysics.velocity[2],
        simplePhysics.velocity[1],
      ];
      thrustVector = [
        simplePhysics.thrust[0],
        simplePhysics.thrust[2],
        simplePhysics.thrust[1],
      ];
    } else {
      // Idle - rocket on pad (y is up in Three.js)
      // Rocket is 50m tall, centered, so Y=25 puts bottom at ground
      rocketPosition = [0, 25, 0];
      rocketVelocity = [0, 0, 0];
      thrustVector = [0, 0, 0];
    }
  } else if (trajectory && trajectory.positions.length > 0) {
    // Use trajectory playback (G-FOLD mode)
    // Physics uses [x, y, z] where z = altitude
    // Three.js uses [x, y, z] where y = up
    // So swap: physics z -> Three.js y, physics y -> Three.js z
    const p1 = trajectory.positions[currentIndex];
    const p2 = trajectory.positions[nextIndex];
    rocketPosition = [
      p1[0] + t * (p2[0] - p1[0]),
      p1[2] + t * (p2[2] - p1[2]),  // z (altitude) -> y (up)
      p1[1] + t * (p2[1] - p1[1]),  // y -> z
    ];

    const v = currentIndex < trajectory.velocities.length
      ? trajectory.velocities[currentIndex]
      : params.v0;
    rocketVelocity = [v[0], v[2], v[1]];  // Swap y/z

    const f = currentIndex < trajectory.thrusts.length
      ? trajectory.thrusts[currentIndex]
      : [0, 0, 0];
    thrustVector = [f[0], f[2], f[1]];  // Swap y/z
  } else {
    // Idle - show rocket at starting position (G-FOLD mode)
    // Position is [x, y, z] where z = altitude in physics
    // Three.js uses y as up, so swap y and z
    rocketPosition = [params.p0[0], params.p0[2], params.p0[1]];
    rocketVelocity = [0, 0, 0];
    thrustVector = [0, 0, 0];
  }

  return (
    <>
      {/* Dark space background */}
      <color attach="background" args={['#030308']} />

      {/* Stars - radius must be larger than max camera distance from origin */}
      <Stars radius={5000} depth={500} count={8000} factor={6} saturation={0} fade speed={0} />

      {/* Camera system - always available for mouse rotation */}
      <OrbitControls
        makeDefault
        minDistance={50}
        maxDistance={3000}
        target={rocketPosition}
        maxPolarAngle={Math.PI / 2 - 0.05}
        enableDamping
        dampingFactor={0.05}
      />
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
        maxThrust={simulationMode === 'simple' ? simpleConfig.maxThrust : params.F_max}
      />

      {/* Explosion effect when crashed */}
      {status === 'crashed' && (
        <Explosion
          position={[
            simplePhysics.position[0],
            simplePhysics.position[2],  // z -> y for Three.js
            simplePhysics.position[1],
          ]}
          impactVelocity={Math.abs(simplePhysics.velocity[2])}
        />
      )}

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
