import { create } from 'zustand';

export type EnvironmentType = 'droneShip' | 'rtls' | 'mars';

interface ShipMotion {
  roll: number;
  pitch: number;
  heave: number;
}

interface EnvironmentState {
  environmentType: EnvironmentType;
  setEnvironmentType: (type: EnvironmentType) => void;

  // Ship motion for drone ship (radians and meters)
  shipMotion: ShipMotion;
  shipTime: number;
  updateShipMotion: (deltaTime: number) => void;
}

export const useEnvironmentStore = create<EnvironmentState>((set) => ({
  environmentType: 'mars',
  setEnvironmentType: (type) => set({ environmentType: type }),

  shipMotion: { roll: 0, pitch: 0, heave: 0 },
  shipTime: 0,

  updateShipMotion: (deltaTime) => set((state) => {
    const newTime = state.shipTime + deltaTime;

    // Gentle ocean swell motion
    const roll = Math.sin(newTime * 0.5) * 0.02 + Math.sin(newTime * 1.3) * 0.01;
    const pitch = Math.sin(newTime * 0.4 + 1) * 0.015 + Math.sin(newTime * 1.1) * 0.008;
    const heave = Math.sin(newTime * 0.6) * 0.5 + Math.sin(newTime * 1.5) * 0.2;

    return {
      shipTime: newTime,
      shipMotion: { roll, pitch, heave },
    };
  }),
}));
