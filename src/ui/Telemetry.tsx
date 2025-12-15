import { useSimulationStore } from '../stores/simulationStore';

export function Telemetry() {
  const {
    trajectory,
    playbackTime,
    params,
    simulationMode,
    simplePhysics,
    simpleConfig,
    status,
  } = useSimulationStore();

  // Simple physics mode telemetry
  if (simulationMode === 'simple') {
    if (status !== 'simpleRunning' && status !== 'crashed' && status !== 'landed') {
      return null;
    }

    const { position, velocity, thrust, elapsedTime, isEngineOn } = simplePhysics;
    const speed = Math.sqrt(velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2);
    const thrustMag = Math.sqrt(thrust[0] ** 2 + thrust[1] ** 2 + thrust[2] ** 2);
    const altitude = position[2];
    const thrustPercent = (thrustMag / simpleConfig.maxThrust) * 100;
    const burnRemaining = Math.max(0, simpleConfig.burnDuration - elapsedTime);

    return (
      <div className="absolute bottom-4 left-4 w-72">
        <div className="mission-panel rounded-lg p-4">
          {/* Corner decorations */}
          <div className="corner-decoration corner-tl" />
          <div className="corner-decoration corner-tr" />
          <div className="corner-decoration corner-bl" />
          <div className="corner-decoration corner-br" />

          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-2 h-2 rounded-full ${
              status === 'crashed' ? 'bg-red-500' :
              status === 'landed' ? 'bg-green-500' :
              isEngineOn ? 'bg-orange-500 animate-pulse' : 'bg-cyan-500 animate-pulse'
            }`} />
            <h3 className="header-display text-xs glow-amber">
              {status === 'crashed' ? 'Impact Data' :
               status === 'landed' ? 'Landing Data' : 'Live Telemetry'}
            </h3>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Altitude */}
            <div>
              <span className="data-label">Altitude</span>
              <div className="data-value text-2xl glow-amber mt-1">
                {altitude.toFixed(0)}
                <span className="text-xs text-amber-500/50 ml-1">m</span>
              </div>
            </div>

            {/* Speed */}
            <div>
              <span className="data-label">Velocity</span>
              <div className={`data-value text-2xl mt-1 ${
                status === 'crashed' ? 'text-red-400' : 'glow-cyan'
              }`}>
                {speed.toFixed(1)}
                <span className="text-xs text-cyan-500/50 ml-1">m/s</span>
              </div>
            </div>
          </div>

          {/* Engine Status */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="data-label">Engine</span>
              <div className={`data-value text-lg mt-1 ${
                isEngineOn ? 'text-orange-400' : 'text-cyan-400'
              }`}>
                {isEngineOn ? 'BURN' : 'OFF'}
              </div>
            </div>
            <div>
              <span className="data-label">T+</span>
              <div className="data-value text-lg glow-amber mt-1">
                {elapsedTime.toFixed(1)}s
              </div>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="space-y-3">
            {/* Burn Remaining */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[9px] text-amber-500/40 uppercase tracking-wider">
                  Burn Remaining
                </span>
                <span className="text-[9px] text-orange-400">
                  {burnRemaining.toFixed(1)}s
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill bg-gradient-to-r from-orange-600 to-red-500"
                  style={{ width: `${(burnRemaining / simpleConfig.burnDuration) * 100}%` }}
                />
              </div>
            </div>

            {/* Thrust Bar */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[9px] text-amber-500/40 uppercase tracking-wider">
                  Thrust Level
                </span>
                <span className="text-[9px] text-cyan-400">
                  {(thrustMag / 1000).toFixed(0)} kN ({thrustPercent.toFixed(0)}%)
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill progress-fill-cyan"
                  style={{ width: `${thrustPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Vertical Velocity */}
          <div className="mt-4 pt-3 border-t border-amber-500/10">
            <span className="data-label block mb-2">Vertical Velocity</span>
            <div className={`font-mono text-lg ${
              velocity[2] > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {velocity[2] > 0 ? '↑' : '↓'} {Math.abs(velocity[2]).toFixed(1)} m/s
            </div>
          </div>
        </div>
      </div>
    );
  }

  // G-FOLD mode telemetry (original)
  if (!trajectory) return null;

  const currentIndex = Math.min(
    Math.floor(playbackTime),
    trajectory.positions.length - 1
  );

  const position = trajectory.positions[currentIndex];
  const velocity = trajectory.velocities[currentIndex];
  const thrust =
    currentIndex < trajectory.thrusts.length
      ? trajectory.thrusts[currentIndex]
      : [0, 0, 0];

  const speed = Math.sqrt(velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2);
  const thrustMag = Math.sqrt(thrust[0] ** 2 + thrust[1] ** 2 + thrust[2] ** 2);
  const altitude = position[2];
  const thrustPercent = (thrustMag / params.F_max) * 100;
  const altPercent = Math.min((altitude / params.p0[2]) * 100, 100);

  return (
    <div className="absolute bottom-4 left-4 w-72">
      <div className="mission-panel rounded-lg p-4">
        {/* Corner decorations */}
        <div className="corner-decoration corner-tl" />
        <div className="corner-decoration corner-tr" />
        <div className="corner-decoration corner-bl" />
        <div className="corner-decoration corner-br" />

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h3 className="header-display text-xs glow-amber">Live Telemetry</h3>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Altitude */}
          <div>
            <span className="data-label">Altitude</span>
            <div className="data-value text-2xl glow-amber mt-1">
              {altitude.toFixed(0)}
              <span className="text-xs text-amber-500/50 ml-1">m</span>
            </div>
          </div>

          {/* Speed */}
          <div>
            <span className="data-label">Velocity</span>
            <div className="data-value text-2xl glow-cyan mt-1">
              {speed.toFixed(1)}
              <span className="text-xs text-cyan-500/50 ml-1">m/s</span>
            </div>
          </div>
        </div>

        {/* Velocity Components */}
        <div className="grid grid-cols-3 gap-2 mb-4 p-2 bg-black/30 rounded">
          <div className="text-center">
            <span className="text-[8px] text-amber-500/40 block">Vx</span>
            <span className="data-value text-xs text-amber-500/80">
              {velocity[0].toFixed(1)}
            </span>
          </div>
          <div className="text-center border-x border-amber-500/10">
            <span className="text-[8px] text-amber-500/40 block">Vy</span>
            <span className="data-value text-xs text-amber-500/80">
              {velocity[1].toFixed(1)}
            </span>
          </div>
          <div className="text-center">
            <span className="text-[8px] text-amber-500/40 block">Vz</span>
            <span className="data-value text-xs text-amber-500/80">
              {velocity[2].toFixed(1)}
            </span>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-3">
          {/* Altitude Bar */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[9px] text-amber-500/40 uppercase tracking-wider">
                Descent Progress
              </span>
              <span className="text-[9px] text-amber-500/60">
                {(100 - altPercent).toFixed(0)}%
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill progress-fill-amber"
                style={{ width: `${100 - altPercent}%` }}
              />
            </div>
          </div>

          {/* Thrust Bar */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[9px] text-amber-500/40 uppercase tracking-wider">
                Thrust Level
              </span>
              <span className="text-[9px] text-cyan-400">
                {(thrustMag / 1000).toFixed(0)} kN ({thrustPercent.toFixed(0)}%)
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill progress-fill-cyan"
                style={{ width: `${thrustPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Position Readout */}
        <div className="mt-4 pt-3 border-t border-amber-500/10">
          <span className="data-label block mb-2">Position Vector</span>
          <div className="font-mono text-[10px] text-amber-500/60 bg-black/30 rounded p-2">
            <span className="text-amber-500/40">X:</span>{' '}
            <span className="text-amber-500">{position[0].toFixed(1).padStart(8)}</span>
            <span className="text-amber-500/40 ml-2">Y:</span>{' '}
            <span className="text-amber-500">{position[1].toFixed(1).padStart(8)}</span>
            <span className="text-amber-500/40 ml-2">Z:</span>{' '}
            <span className="text-amber-500">{position[2].toFixed(1).padStart(8)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
