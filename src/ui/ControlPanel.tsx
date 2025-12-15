import { useSimulationStore, scenarios } from '../stores/simulationStore';
import { solveLanding } from '../simulation/GFoldSolver';

export function ControlPanel() {
  const {
    params,
    status,
    trajectory,
    playbackTime,
    playbackSpeed,
    setParams,
    loadScenario,
    setStatus,
    setTrajectory,
    setPlaybackTime,
    setPlaybackSpeed,
    setErrorMessage,
    showTrajectory,
    showThrustVectors,
    toggleTrajectory,
    toggleThrustVectors,
    reset,
  } = useSimulationStore();

  const handleSolve = async () => {
    setStatus('solving');
    setErrorMessage(null);
    try {
      const result = await solveLanding(params);
      setTrajectory(result);
      setStatus('ready');
      setPlaybackTime(0);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handlePlay = () => {
    setStatus('playing');
  };

  const handlePause = () => {
    setStatus('paused');
  };

  const handleReset = () => {
    reset();
  };

  const maxTime = trajectory ? trajectory.positions.length - 1 : params.K;

  return (
    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white w-72 space-y-4">
      <h2 className="text-lg font-bold text-orange-400">G-FOLD Rocket Landing</h2>

      {/* Scenario selection */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Scenario</label>
        <select
          className="w-full bg-gray-800 rounded px-2 py-1 text-sm"
          value={scenarios.findIndex((s) => s.params === params)}
          onChange={(e) => loadScenario(scenarios[parseInt(e.target.value)])}
        >
          {scenarios.map((s, i) => (
            <option key={s.name} value={i}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Parameters */}
      <div className="space-y-2">
        <label className="block text-sm text-gray-400">Parameters</label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">Gravity:</span>
            <input
              type="number"
              value={params.g}
              onChange={(e) => setParams({ g: parseFloat(e.target.value) })}
              className="w-16 bg-gray-800 rounded px-1 ml-1"
              step="0.1"
            />
          </div>
          <div>
            <span className="text-gray-500">Mass:</span>
            <input
              type="number"
              value={params.m}
              onChange={(e) => setParams({ m: parseFloat(e.target.value) })}
              className="w-16 bg-gray-800 rounded px-1 ml-1"
              step="100"
            />
          </div>
          <div>
            <span className="text-gray-500">F_max:</span>
            <input
              type="number"
              value={params.F_max}
              onChange={(e) => setParams({ F_max: parseFloat(e.target.value) })}
              className="w-16 bg-gray-800 rounded px-1 ml-1"
              step="10000"
            />
          </div>
          <div>
            <span className="text-gray-500">Steps:</span>
            <input
              type="number"
              value={params.K}
              onChange={(e) => setParams({ K: parseInt(e.target.value) })}
              className="w-16 bg-gray-800 rounded px-1 ml-1"
              step="5"
            />
          </div>
        </div>
      </div>

      {/* Solve button */}
      <button
        onClick={handleSolve}
        disabled={status === 'solving'}
        className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 rounded py-2 font-semibold transition-colors"
      >
        {status === 'solving' ? 'Solving...' : 'Solve Trajectory'}
      </button>

      {/* Playback controls */}
      {trajectory && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={status === 'playing' ? handlePause : handlePlay}
              className="flex-1 bg-blue-600 hover:bg-blue-500 rounded py-1 text-sm"
            >
              {status === 'playing' ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={handleReset}
              className="flex-1 bg-gray-600 hover:bg-gray-500 rounded py-1 text-sm"
            >
              Reset
            </button>
          </div>

          {/* Time slider */}
          <div>
            <label className="text-xs text-gray-400">
              Time: {playbackTime.toFixed(1)}s / {maxTime}s
            </label>
            <input
              type="range"
              min={0}
              max={maxTime}
              step={0.1}
              value={playbackTime}
              onChange={(e) => setPlaybackTime(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Speed control */}
          <div>
            <label className="text-xs text-gray-400">Speed: {playbackSpeed}x</label>
            <input
              type="range"
              min={0.1}
              max={5}
              step={0.1}
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Visualization toggles */}
      <div className="space-y-1">
        <label className="block text-sm text-gray-400">Display</label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showTrajectory}
            onChange={toggleTrajectory}
            className="rounded"
          />
          Trajectory Path
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showThrustVectors}
            onChange={toggleThrustVectors}
            className="rounded"
          />
          Thrust Vectors
        </label>
      </div>

      {/* Status */}
      <div className="text-xs text-gray-500">
        Status: <span className={status === 'error' ? 'text-red-400' : 'text-green-400'}>{status}</span>
        {trajectory && (
          <div>Fuel used: {trajectory.fuelUsed.toFixed(0)} N·s</div>
        )}
      </div>
    </div>
  );
}
