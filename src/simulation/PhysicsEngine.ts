// Simple Newtonian physics engine for rocket simulation
// Semi-implicit Euler integration (more stable than basic Euler)

export interface PhysicsConfig {
  gravity: number;        // m/s² (Mars = 3.72)
  mass: number;           // kg
  maxThrust: number;      // N
  burnDuration: number;   // seconds
}

export interface PhysicsState {
  position: [number, number, number];
  velocity: [number, number, number];
  thrust: [number, number, number];
  elapsedTime: number;
  isEngineOn: boolean;
  hasCrashed: boolean;
  hasLandedSafely: boolean;
}

export function createInitialState(): PhysicsState {
  return {
    position: [0, 0, 25],      // Start on pad (z=25 because 50m rocket is centered)
    velocity: [0, 0, 0],
    thrust: [0, 0, 0],
    elapsedTime: 0,
    isEngineOn: true,
    hasCrashed: false,
    hasLandedSafely: false,
  };
}

export function stepPhysics(
  state: PhysicsState,
  config: PhysicsConfig,
  dt: number,
  groundHeight: number = 0
): PhysicsState {
  // Don't update if simulation is over
  if (state.hasCrashed || state.hasLandedSafely) return state;

  const newState = { ...state };
  newState.elapsedTime += dt;

  // Check if engine should cut off
  newState.isEngineOn = newState.elapsedTime < config.burnDuration;

  // Calculate vertical acceleration
  let az = -config.gravity; // Gravity pulls down

  if (newState.isEngineOn) {
    const thrustAccel = config.maxThrust / config.mass;
    az += thrustAccel;
    newState.thrust = [0, 0, config.maxThrust];
  } else {
    newState.thrust = [0, 0, 0];
  }

  // Semi-implicit Euler integration
  // Update velocity first, then use new velocity for position
  newState.velocity = [
    state.velocity[0],
    state.velocity[1],
    state.velocity[2] + az * dt,
  ];

  newState.position = [
    state.position[0] + newState.velocity[0] * dt,
    state.position[1] + newState.velocity[1] * dt,
    state.position[2] + newState.velocity[2] * dt,
  ];

  // Ground collision detection
  if (newState.position[2] <= groundHeight && newState.velocity[2] < 0) {
    newState.position[2] = groundHeight;

    const impactSpeed = Math.abs(newState.velocity[2]);
    const SAFE_LANDING_SPEED = 5; // m/s

    if (impactSpeed < SAFE_LANDING_SPEED) {
      newState.hasLandedSafely = true;
      newState.velocity = [0, 0, 0];
    } else {
      newState.hasCrashed = true;
    }
  }

  return newState;
}
