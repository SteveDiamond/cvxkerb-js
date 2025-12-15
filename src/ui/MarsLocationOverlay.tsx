import { useSimulationStore } from '../stores/simulationStore';

// Jezero Crater - Perseverance landing site
const BASE_LOCATION = {
  name: 'JEZERO CRATER',
  subtitle: 'Perseverance Landing Site',
  latitude: 18.4446,  // degrees N
  longitude: 77.4509, // degrees E
};

// Approximate degrees per meter on Mars at this latitude
// Mars radius ~3389.5 km, at 18.4° latitude
const DEGREES_PER_METER = 0.00003;

export function MarsLocationOverlay() {
  const { simulationMode, simplePhysics, trajectory, playbackTime, status } = useSimulationStore();

  // Get current position based on simulation mode
  let position: [number, number, number] = [0, 0, 0];
  let altitude = 0;

  if (simulationMode === 'simple') {
    if (status === 'simpleRunning' || status === 'crashed' || status === 'landed') {
      position = simplePhysics.position;
      altitude = position[2]; // Z is altitude in physics coords
    }
  } else if (trajectory && (status === 'playing' || status === 'paused')) {
    const currentIndex = Math.min(
      Math.floor(playbackTime),
      trajectory.positions.length - 1
    );
    position = trajectory.positions[currentIndex];
    altitude = position[2];
  }

  // Calculate lat/long offset from rocket position
  // X maps to longitude offset, Y (physics) maps to latitude offset
  const latOffset = position[1] * DEGREES_PER_METER;
  const lonOffset = position[0] * DEGREES_PER_METER;

  const currentLat = BASE_LOCATION.latitude + latOffset;
  const currentLon = BASE_LOCATION.longitude + lonOffset;

  // Format coordinates
  const formatCoord = (value: number, isLat: boolean) => {
    const abs = Math.abs(value);
    const dir = isLat ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W');
    return `${abs.toFixed(4)}°${dir}`;
  };

  return (
    <div className="absolute top-28 right-4 w-56">
      <div className="mission-panel rounded-lg p-3">
        {/* Corner decorations */}
        <div className="corner-decoration corner-tl" />
        <div className="corner-decoration corner-tr" />
        <div className="corner-decoration corner-bl" />
        <div className="corner-decoration corner-br" />

        {/* Location Name */}
        <div className="text-center mb-2">
          <h3 className="header-display text-sm glow-amber tracking-wider">
            {BASE_LOCATION.name}
          </h3>
          <span className="text-[9px] text-amber-500/50 uppercase tracking-wide">
            {BASE_LOCATION.subtitle}
          </span>
        </div>

        {/* Coordinates */}
        <div className="space-y-1 text-center">
          <div className="flex justify-between px-2">
            <span className="text-[10px] text-amber-500/40 uppercase">LAT</span>
            <span className="font-mono text-xs text-amber-500/80">
              {formatCoord(currentLat, true)}
            </span>
          </div>
          <div className="flex justify-between px-2">
            <span className="text-[10px] text-amber-500/40 uppercase">LON</span>
            <span className="font-mono text-xs text-amber-500/80">
              {formatCoord(currentLon, false)}
            </span>
          </div>
          <div className="flex justify-between px-2 pt-1 border-t border-amber-500/10">
            <span className="text-[10px] text-amber-500/40 uppercase">ALT</span>
            <span className="font-mono text-xs text-cyan-400">
              {altitude.toFixed(0)} m
            </span>
          </div>
        </div>

        {/* Mars indicator */}
        <div className="mt-2 pt-2 border-t border-amber-500/10 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-600" />
          <span className="text-[9px] text-amber-500/40 uppercase tracking-wider">
            Mars Surface
          </span>
        </div>
      </div>
    </div>
  );
}
