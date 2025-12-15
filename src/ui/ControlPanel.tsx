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

  const handlePlay = () => setStatus('playing');
  const handlePause = () => setStatus('paused');
  const handleReset = () => reset();

  const maxTime = trajectory ? trajectory.positions.length - 1 : params.K;

  const statusConfig = {
    idle: { label: 'STANDBY', dot: 'status-warning' },
    solving: { label: 'COMPUTING', dot: 'status-active' },
    ready: { label: 'READY', dot: 'status-nominal' },
    playing: { label: 'ACTIVE', dot: 'status-active' },
    paused: { label: 'PAUSED', dot: 'status-warning' },
    error: { label: 'ERROR', dot: 'status-error' },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="absolute top-4 left-4 w-80">
      {/* Main Control Panel */}
      <div className="mission-panel rounded-lg p-5 space-y-5">
        {/* Corner decorations */}
        <div className="corner-decoration corner-tl" />
        <div className="corner-decoration corner-tr" />
        <div className="corner-decoration corner-bl" />
        <div className="corner-decoration corner-br" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="header-display text-lg glow-amber">G-FOLD</h2>
            <p className="text-[10px] text-amber-500/50 tracking-widest">
              POWERED DESCENT GUIDANCE
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`status-dot ${currentStatus.dot}`} />
            <span className="text-xs text-amber-500/70">{currentStatus.label}</span>
          </div>
        </div>

        {/* Scenario Selection */}
        <div>
          <label className="data-label block mb-2">Mission Profile</label>
          <select
            className="mission-select w-full rounded px-3 py-2 text-sm"
            value={scenarios.findIndex((s) => s.name === scenarios.find(sc =>
              sc.params.g === params.g && sc.params.m === params.m
            )?.name)}
            onChange={(e) => loadScenario(scenarios[parseInt(e.target.value)])}
          >
            {scenarios.map((s, i) => (
              <option key={s.name} value={i}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Parameters Grid */}
        <div>
          <label className="data-label block mb-2">Vehicle Parameters</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[9px] text-amber-500/40 uppercase tracking-wider">
                Gravity (m/s²)
              </span>
              <input
                type="number"
                value={params.g}
                onChange={(e) => setParams({ g: parseFloat(e.target.value) })}
                className="mission-input w-full rounded px-2 py-1 text-sm mt-1"
                step="0.1"
              />
            </div>
            <div>
              <span className="text-[9px] text-amber-500/40 uppercase tracking-wider">
                Mass (kg)
              </span>
              <input
                type="number"
                value={params.m}
                onChange={(e) => setParams({ m: parseFloat(e.target.value) })}
                className="mission-input w-full rounded px-2 py-1 text-sm mt-1"
                step="100"
              />
            </div>
            <div>
              <span className="text-[9px] text-amber-500/40 uppercase tracking-wider">
                Max Thrust (N)
              </span>
              <input
                type="number"
                value={params.F_max}
                onChange={(e) => setParams({ F_max: parseFloat(e.target.value) })}
                className="mission-input w-full rounded px-2 py-1 text-sm mt-1"
                step="10000"
              />
            </div>
            <div>
              <span className="text-[9px] text-amber-500/40 uppercase tracking-wider">
                Time Steps
              </span>
              <input
                type="number"
                value={params.K}
                onChange={(e) => setParams({ K: parseInt(e.target.value) })}
                className="mission-input w-full rounded px-2 py-1 text-sm mt-1"
                step="5"
              />
            </div>
          </div>
        </div>

        {/* Solve Button */}
        <button
          onClick={handleSolve}
          disabled={status === 'solving'}
          className="mission-btn mission-btn-primary w-full rounded py-3 text-sm"
        >
          {status === 'solving' ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Computing Trajectory
            </span>
          ) : (
            'Compute Trajectory'
          )}
        </button>

        {/* Playback Controls */}
        {trajectory && (
          <div className="space-y-4 pt-2 border-t border-amber-500/10">
            <div className="flex gap-2">
              <button
                onClick={status === 'playing' ? handlePause : handlePlay}
                className="mission-btn flex-1 rounded py-2 text-xs"
              >
                {status === 'playing' ? '❚❚ Pause' : '▶ Play'}
              </button>
              <button
                onClick={handleReset}
                className="mission-btn flex-1 rounded py-2 text-xs"
              >
                ↺ Reset
              </button>
            </div>

            {/* Timeline */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[9px] text-amber-500/40 uppercase tracking-wider">
                  Mission Time
                </span>
                <span className="data-value text-xs glow-amber">
                  T+{playbackTime.toFixed(1)}s
                </span>
              </div>
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

            {/* Speed */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[9px] text-amber-500/40 uppercase tracking-wider">
                  Playback Speed
                </span>
                <span className="data-value text-xs text-cyan-400">
                  {playbackSpeed}x
                </span>
              </div>
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

        {/* Display Options */}
        <div className="pt-2 border-t border-amber-500/10">
          <label className="data-label block mb-2">Display Layers</label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 text-xs text-amber-500/70 cursor-pointer hover:text-amber-500 transition-colors">
              <input
                type="checkbox"
                checked={showTrajectory}
                onChange={toggleTrajectory}
              />
              Trajectory Path
            </label>
            <label className="flex items-center gap-3 text-xs text-amber-500/70 cursor-pointer hover:text-amber-500 transition-colors">
              <input
                type="checkbox"
                checked={showThrustVectors}
                onChange={toggleThrustVectors}
              />
              Thrust Vectors
            </label>
          </div>
        </div>

        {/* Fuel Usage */}
        {trajectory && (
          <div className="pt-2 border-t border-amber-500/10">
            <div className="flex justify-between items-baseline">
              <span className="data-label">Fuel Consumption</span>
              <span className="data-value text-lg glow-cyan">
                {(trajectory.fuelUsed / 1000).toFixed(1)}
                <span className="text-xs text-cyan-500/50 ml-1">kN·s</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
