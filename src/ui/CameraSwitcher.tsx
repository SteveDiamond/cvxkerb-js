import { useCameraStore, cameraModes, type CameraMode } from '../stores/cameraStore';

export function CameraSwitcher() {
  const { activeCamera, startTransition } = useCameraStore();

  const handleCameraChange = (mode: CameraMode) => {
    if (mode !== activeCamera) {
      startTransition(mode);
    }
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
      <div className="mission-panel rounded-lg px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-amber-500/50 uppercase tracking-wider mr-3">
            Camera
          </span>
          {cameraModes.map((cam) => (
            <button
              key={cam.mode}
              onClick={() => handleCameraChange(cam.mode)}
              className={`
                px-3 py-1.5 rounded text-xs transition-all
                ${
                  activeCamera === cam.mode
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                    : 'bg-black/30 text-amber-500/60 border border-amber-500/20 hover:border-amber-500/40 hover:text-amber-500'
                }
              `}
              title={`${cam.description} (${cam.key})`}
            >
              <span className="text-[9px] text-amber-500/40 mr-1">{cam.key}</span>
              {cam.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
