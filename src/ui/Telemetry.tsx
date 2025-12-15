import { useSimulationStore } from '../stores/simulationStore';

export function Telemetry() {
  const { trajectory, playbackTime, params } = useSimulationStore();

  if (!trajectory) return null;

  const currentIndex = Math.min(
    Math.floor(playbackTime),
    trajectory.positions.length - 1
  );

  const position = trajectory.positions[currentIndex];
  const velocity = trajectory.velocities[currentIndex];
  const thrust = currentIndex < trajectory.thrusts.length
    ? trajectory.thrusts[currentIndex]
    : [0, 0, 0];

  const speed = Math.sqrt(velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2);
  const thrustMag = Math.sqrt(thrust[0] ** 2 + thrust[1] ** 2 + thrust[2] ** 2);
  const altitude = position[2];

  return (
    <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white w-64">
      <h3 className="text-sm font-bold text-orange-400 mb-2">Telemetry</h3>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
        <div className="text-gray-400">Altitude</div>
        <div className="text-right">{altitude.toFixed(1)} m</div>

        <div className="text-gray-400">Speed</div>
        <div className="text-right">{speed.toFixed(1)} m/s</div>

        <div className="text-gray-400">Vx</div>
        <div className="text-right">{velocity[0].toFixed(1)} m/s</div>

        <div className="text-gray-400">Vy</div>
        <div className="text-right">{velocity[1].toFixed(1)} m/s</div>

        <div className="text-gray-400">Vz</div>
        <div className="text-right">{velocity[2].toFixed(1)} m/s</div>

        <div className="text-gray-400">Thrust</div>
        <div className="text-right">{(thrustMag / 1000).toFixed(0)} kN</div>

        <div className="text-gray-400">% Max Thrust</div>
        <div className="text-right">{((thrustMag / params.F_max) * 100).toFixed(0)}%</div>
      </div>

      {/* Altitude bar */}
      <div className="mt-3">
        <div className="text-xs text-gray-400 mb-1">Altitude</div>
        <div className="h-2 bg-gray-700 rounded overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-orange-500 transition-all"
            style={{ width: `${Math.min((altitude / params.p0[2]) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Thrust bar */}
      <div className="mt-2">
        <div className="text-xs text-gray-400 mb-1">Thrust</div>
        <div className="h-2 bg-gray-700 rounded overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-red-500 transition-all"
            style={{ width: `${Math.min((thrustMag / params.F_max) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
