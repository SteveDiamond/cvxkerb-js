import { create } from 'zustand';

export interface LandingParams {
  K: number;         // Number of time steps
  h: number;         // Time step in seconds
  g: number;         // Gravity (m/s²)
  m: number;         // Rocket mass (kg)
  F_max: number;     // Maximum thrust (N)
  P_min: number;     // Minimum altitude (m)
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

export type SimulationStatus = 'idle' | 'solving' | 'ready' | 'playing' | 'paused' | 'error';

export interface Scenario {
  name: string;
  params: LandingParams;
}

export const scenarios: Scenario[] = [
  {
    name: 'Falcon 9 RTLS',
    params: {
      K: 50,
      h: 1.0,
      g: 9.81,
      m: 25000,
      F_max: 800000,
      P_min: 0,
      p0: [500, 200, 1000],
      v0: [-50, -20, -80],
      p_target: [0, 0, 0],
    },
  },
  {
    name: 'Mars Lander',
    params: {
      K: 60,
      h: 1.0,
      g: 3.72,
      m: 2000,
      F_max: 30000,
      P_min: 0,
      p0: [300, 100, 800],
      v0: [-30, -10, -50],
      p_target: [0, 0, 0],
    },
  },
  {
    name: 'Lunar Lander',
    params: {
      K: 80,
      h: 1.0,
      g: 1.62,
      m: 5000,
      F_max: 40000,
      P_min: 0,
      p0: [200, 50, 500],
      v0: [-20, -5, -30],
      p_target: [0, 0, 0],
    },
  },
];

interface SimulationState {
  // Parameters
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

export const useSimulationStore = create<SimulationState>((set) => ({
  // Parameters
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
    }),
}));
