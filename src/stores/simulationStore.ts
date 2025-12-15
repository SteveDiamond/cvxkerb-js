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

export type SimulationStatus = 'idle' | 'solving' | 'ready' | 'playing' | 'paused' | 'error' | 'simpleRunning' | 'crashed' | 'landed';

export type SimulationMode = 'gfold' | 'simple';

export interface Scenario {
  name: string;
  params: LandingParams;
}

export const scenarios: Scenario[] = [
  {
    name: 'Mars Starship',
    params: {
      K: 35,           // Shorter, more dramatic
      h: 1.0,
      g: 3.72,
      m: 120000,
      F_max: 2200000,  // Slightly more thrust for aggressive maneuver
      P_min: 0,
      alpha: Math.PI / 30,
      p0: [600, 100, 1500],      // Higher, offset
      v0: [-80, -20, -120],      // Coming in HOT - 145 m/s total
      p_target: [0, 0, 0],
    },
  },
  {
    name: 'Steep Dive',
    params: {
      K: 30,
      h: 1.0,
      g: 3.72,
      m: 120000,
      F_max: 2500000,
      P_min: 0,
      alpha: Math.PI / 25,
      p0: [200, 50, 2000],       // Very high, almost above pad
      v0: [-30, -10, -180],      // Screaming downward
      p_target: [0, 0, 0],
    },
  },
  {
    name: 'Falcon 9 RTLS',
    params: {
      K: 40,
      h: 1.0,
      g: 9.81,
      m: 25000,
      F_max: 850000,
      P_min: 0,
      alpha: Math.PI / 20,
      p0: [800, 150, 1200],
      v0: [-100, -30, -100],     // Fast approach
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
  // Simulation mode - default to G-FOLD
  simulationMode: 'gfold',
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
  playbackSpeed: 2,  // Default 2x speed for more dramatic playback
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

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
      simplePhysics: createInitialState(),
    }),
}));
