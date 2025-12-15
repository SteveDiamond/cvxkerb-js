import { create } from 'zustand';

export type CameraMode = 'orbit' | 'chase' | 'ground' | 'tracking' | 'engine';

interface CameraState {
  activeCamera: CameraMode;
  setActiveCamera: (camera: CameraMode) => void;

  // For smooth transitions
  isTransitioning: boolean;
  transitionProgress: number;
  previousCamera: CameraMode;
  startTransition: (to: CameraMode) => void;
  updateTransition: (progress: number) => void;
  completeTransition: () => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  activeCamera: 'chase',
  setActiveCamera: (camera) => set({ activeCamera: camera }),

  isTransitioning: false,
  transitionProgress: 0,
  previousCamera: 'chase',

  startTransition: (to) => set((state) => ({
    isTransitioning: true,
    transitionProgress: 0,
    previousCamera: state.activeCamera,
    activeCamera: to,
  })),

  updateTransition: (progress) => set({ transitionProgress: progress }),

  completeTransition: () => set({
    isTransitioning: false,
    transitionProgress: 1,
  }),
}));

// Camera mode descriptions for UI
export const cameraModes: { mode: CameraMode; label: string; key: string; description: string }[] = [
  { mode: 'orbit', label: 'Free', key: '1', description: 'Free orbit camera' },
  { mode: 'chase', label: 'Chase', key: '2', description: 'Follow behind rocket' },
  { mode: 'ground', label: 'Ground', key: '3', description: 'View from ground' },
  { mode: 'tracking', label: 'Track', key: '4', description: 'Side tracking view' },
  { mode: 'engine', label: 'Engine', key: '5', description: 'Engine camera view' },
];
