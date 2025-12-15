import { create } from 'zustand';
import { type PhysicsState, type PhysicsConfig, createInitialState } from '../simulation/PhysicsEngine';

export interface LandingParams {
  K: number;         // Number of time steps
  h: number;         // Time step in seconds
  g: number;         // Gravity (m/s²)
  m: number;         // Rocket mass (kg)
  F_max: number;     // Maximum thrust (N)
  P_min: number;     // Minimum altitude (m)
  alpha: number;     // Glide slope angle (radians)
  p0: [number, number, number];      // Initial position [x, y, z]
  v0: [number, number, number];      // Initial velocity [vx, vy, vz]
  p_target: [number, number, number]; // Landing pad position
}

export interface TrajectoryData {
  positions: [number, number, number][];
  velocities: [number, number, number][];
  thrusts: [number, number, number][];
  fuelUsed: number;
}

export type SimulationStatus = 'idle' | 'solving' | 'ready' | 'playing' | 'paused' | 'error' | 'launching' | 'simpleRunning' | 'crashed' | 'landed';

export type SimulationMode = 'gfold' | 'simple';

export interface Scenario {
  name: string;
  params: LandingParams;
}

export const scenarios: Scenario[] = [
  {
    name: 'Mars Starship',
    params: {
      K: 60,
      h: 1.0,
      g: 3.72,
      m: 120000,
      F_max: 2000000,
      P_min: 0,
      alpha: Math.PI / 30, // ~6 degrees
      p0: [400, 150, 1200],
      v0: [-40, -15, -60],
      p_target: [0, 0, 0],
    },
  },
  {
    name: 'Mars Lander',
    params: {
      K: 50,
      h: 1.0,
      g: 3.72,
      m: 2000,
      F_max: 30000,
      P_min: 0,
      alpha: Math.PI / 25, // ~7 degrees
      p0: [300, 100, 800],
      v0: [-30, -10, -50],
      p_target: [0, 0, 0],
    },
  },
  {
    name: 'Falcon 9 Earth',
    params: {
      K: 50,
      h: 1.0,
      g: 9.81,
      m: 25000,
      F_max: 800000,
      P_min: 0,
      alpha: Math.PI / 20, // ~9 degrees
      p0: [500, 200, 1000],
      v0: [-50, -20, -80],
      p_target: [0, 0, 0],
    },
  },
];

interface SimulationState {
  // Simulation mode
  simulationMode: SimulationMode;
  setSimulationMode: (mode: SimulationMode) => void;

  // Simple physics state
  simpleConfig: PhysicsConfig;
  setSimpleConfig: (config: Partial<PhysicsConfig>) => void;
  simplePhysics: PhysicsState;
  setSimplePhysics: (state: PhysicsState) => void;

  // Parameters (G-FOLD)
  params: LandingParams;
  setParams: (params: Partial<LandingParams>) => void;
  loadScenario: (scenario: Scenario) => void;

  // Trajectory data
  trajectory: TrajectoryData | null;
  setTrajectory: (data: TrajectoryData | null) => void;

  // Simulation status
  status: SimulationStatus;
  setStatus: (status: SimulationStatus) => void;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;

  // Playback
  playbackTime: number;
  setPlaybackTime: (time: number) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;

  // Launch state
  launchTime: number;
  setLaunchTime: (time: number) => void;
  launchPosition: [number, number, number];
  launchVelocity: [number, number, number];
  launchThrust: number;
  setLaunchState: (state: {
    position?: [number, number, number];
    velocity?: [number, number, number];
    thrust?: number;
  }) => void;

  // Visualization toggles
  showTrajectory: boolean;
  showThrustVectors: boolean;
  showGlideslopeCone: boolean;
  toggleTrajectory: () => void;
  toggleThrustVectors: () => void;
  toggleGlideslopeCone: () => void;

  // Reset
  reset: () => void;
}

const defaultParams = scenarios[0].params;

const defaultSimpleConfig: PhysicsConfig = {
  gravity: 3.72,        // Mars
  mass: 25000,          // kg
  maxThrust: 800000,    // N
  burnDuration: 10,     // seconds
};

export const useSimulationStore = create<SimulationState>((set) => ({
  // Simulation mode
  simulationMode: 'simple',
  setSimulationMode: (mode) => set({ simulationMode: mode, status: 'idle' }),

  // Simple physics state
  simpleConfig: defaultSimpleConfig,
  setSimpleConfig: (newConfig) =>
    set((state) => ({ simpleConfig: { ...state.simpleConfig, ...newConfig } })),
  simplePhysics: createInitialState(),
  setSimplePhysics: (state) => set({ simplePhysics: state }),

  // Parameters (G-FOLD)
  params: defaultParams,
  setParams: (newParams) =>
    set((state) => ({ params: { ...state.params, ...newParams } })),
  loadScenario: (scenario) =>
    set({ params: scenario.params, trajectory: null, status: 'idle', playbackTime: 0 }),

  // Trajectory
  trajectory: null,
  setTrajectory: (data) => set({ trajectory: data }),

  // Status
  status: 'idle',
  setStatus: (status) => set({ status }),
  errorMessage: null,
  setErrorMessage: (msg) => set({ errorMessage: msg }),

  // Playback
  playbackTime: 0,
  setPlaybackTime: (time) => set({ playbackTime: time }),
  playbackSpeed: 1,
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  // Launch state
  launchTime: -5,
  setLaunchTime: (time) => set({ launchTime: time }),
  launchPosition: [0, 0, 5],
  launchVelocity: [0, 0, 0],
  launchThrust: 0,
  setLaunchState: (state) => set((prev) => ({
    launchPosition: state.position ?? prev.launchPosition,
    launchVelocity: state.velocity ?? prev.launchVelocity,
    launchThrust: state.thrust ?? prev.launchThrust,
  })),

  // Visualization
  showTrajectory: true,
  showThrustVectors: true,
  showGlideslopeCone: false,
  toggleTrajectory: () => set((s) => ({ showTrajectory: !s.showTrajectory })),
  toggleThrustVectors: () => set((s) => ({ showThrustVectors: !s.showThrustVectors })),
  toggleGlideslopeCone: () => set((s) => ({ showGlideslopeCone: !s.showGlideslopeCone })),

  // Reset
  reset: () =>
    set({
      trajectory: null,
      status: 'idle',
      playbackTime: 0,
      errorMessage: null,
      launchTime: -5,
      launchPosition: [0, 0, 5],
      launchVelocity: [0, 0, 0],
      launchThrust: 0,
      simplePhysics: createInitialState(),
    }),
}));
