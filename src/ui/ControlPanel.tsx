import { useSimulationStore, scenarios } from '../stores/simulationStore';
import { useEnvironmentStore, type EnvironmentType } from '../stores/environmentStore';
import { useCameraStore } from '../stores/cameraStore';
import { solveLanding } from '../simulation/GFoldSolver';
import { createInitialState } from '../simulation/PhysicsEngine';

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
    showGlideslopeCone,
    toggleTrajectory,
    toggleThrustVectors,
    toggleGlideslopeCone,
    reset,
    // Simple physics mode
    simulationMode,
    setSimulationMode,
    simpleConfig,
    setSimpleConfig,
    setSimplePhysics,
  } = useSimulationStore();

  const { environmentType, setEnvironmentType } = useEnvironmentStore();
  const { startTransition } = useCameraStore();

  const environmentOptions: { value: EnvironmentType; label: string }[] = [
    { value: 'droneShip', label: 'Drone Ship (Ocean)' },
    { value: 'rtls', label: 'RTLS (Land)' },
    { value: 'mars', label: 'Mars Surface' },
  ];

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
  const handleLaunch = () => {
    reset();
    setStatus('launching');
  };

  // Simple physics handlers
  const handleSimpleLaunch = () => {
    setSimplePhysics(createInitialState());
    setStatus('simpleRunning');
    startTransition('chase'); // Auto-switch to chase camera for dramatic view
  };

  const handleSimpleReset = () => {
    setSimplePhysics(createInitialState());
    setStatus('idle');
  };

  const maxTime = trajectory ? trajectory.positions.length - 1 : params.K;

  const statusConfig: Record<string, { label: string; dot: string }> = {
    idle: { label: 'STANDBY', dot: 'status-warning' },
    launching: { label: 'LAUNCHING', dot: 'status-active' },
    solving: { label: 'COMPUTING', dot: 'status-active' },
    ready: { label: 'READY', dot: 'status-nominal' },
    playing: { label: 'DESCENT', dot: 'status-active' },
    paused: { label: 'PAUSED', dot: 'status-warning' },
    error: { label: 'ERROR', dot: 'status-error' },
    // Simple physics statuses
    simpleRunning: { label: 'IN FLIGHT', dot: 'status-active' },
    crashed: { label: 'CRASHED', dot: 'status-error' },
    landed: { label: 'LANDED', dot: 'status-nominal' },
  };

  const currentStatus = statusConfig[status] || statusConfig.idle;

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
            <h2 className="header-display text-lg glow-amber">
              {simulationMode === 'simple' ? 'PHYSICS' : 'G-FOLD'}
            </h2>
            <p className="text-[10px] text-amber-500/50 tracking-widest">
              {simulationMode === 'simple' ? 'NEWTONIAN SIMULATION' : 'POWERED DESCENT GUIDANCE'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`status-dot ${currentStatus.dot}`} />
            <span className="text-xs text-amber-500/70">{currentStatus.label}</span>
          </div>
        </div>

        {/* Mode Selector */}
        <div>
          <label className="data-label block mb-2">Simulation Mode</label>
          <div className="flex gap-2">
            <button
              onClick={() => { handleSimpleReset(); setSimulationMode('simple'); }}
              className={`flex-1 rounded py-2 text-xs transition-all ${
                simulationMode === 'simple'
                  ? 'bg-cyan-600 text-white'
                  : 'mission-btn opacity-60 hover:opacity-100'
              }`}
            >
              Simple Physics
            </button>
            <button
              onClick={() => { handleReset(); setSimulationMode('gfold'); }}
              className={`flex-1 rounded py-2 text-xs transition-all ${
                simulationMode === 'gfold'
                  ? 'bg-amber-600 text-white'
                  : 'mission-btn opacity-60 hover:opacity-100'
              }`}
            >
              G-FOLD Landing
            </button>
          </div>
        </div>

        {/* Simple Physics Controls */}
        {simulationMode === 'simple' && (
          <>
            {/* Environment Selection */}
            <div>
              <label className="data-label block mb-2">Landing Environment</label>
              <select
                className="mission-select w-full rounded px-3 py-2 text-sm"
                value={environmentType}
                onChange={(e) => setEnvironmentType(e.target.value as EnvironmentType)}
              >
                {environmentOptions.map((env) => (
                  <option key={env.value} value={env.value}>
                    {env.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Simple Physics Parameters */}
            <div>
              <label className="data-label block mb-2">Physics Parameters</label>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[9px] text-amber-500/40 uppercase tracking-wider">
                      Burn Duration
                    </span>
                    <span className="data-value text-xs glow-cyan">
                      {simpleConfig.burnDuration.toFixed(1)}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    step={0.5}
                    value={simpleConfig.burnDuration}
                    onChange={(e) => setSimpleConfig({ burnDuration: parseFloat(e.target.value) })}
                    disabled={status === 'simpleRunning'}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[9px] text-amber-500/40 uppercase tracking-wider">
                      Thrust
                    </span>
                    <span className="data-value text-xs glow-cyan">
                      {(simpleConfig.maxThrust / 1000).toFixed(0)} kN
                    </span>
                  </div>
                  <input
                    type="range"
                    min={100000}
                    max={2000000}
                    step={50000}
                    value={simpleConfig.maxThrust}
                    onChange={(e) => setSimpleConfig({ maxThrust: parseFloat(e.target.value) })}
                    disabled={status === 'simpleRunning'}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] text-amber-500/40 uppercase tracking-wider">
                      Mass (kg)
                    </span>
                    <input
                      type="number"
                      value={simpleConfig.mass}
                      onChange={(e) => setSimpleConfig({ mass: parseFloat(e.target.value) })}
                      disabled={status === 'simpleRunning'}
                      className="mission-input w-full rounded px-2 py-1 text-sm mt-1"
                      step="1000"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] text-amber-500/40 uppercase tracking-wider">
                      Gravity (m/s²)
                    </span>
                    <input
                      type="number"
                      value={simpleConfig.gravity}
                      onChange={(e) => setSimpleConfig({ gravity: parseFloat(e.target.value) })}
                      disabled={status === 'simpleRunning'}
                      className="mission-input w-full rounded px-2 py-1 text-sm mt-1"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Simple Launch Button */}
            <button
              onClick={handleSimpleLaunch}
              disabled={status === 'simpleRunning'}
              className="mission-btn w-full rounded py-3 text-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold tracking-wider"
            >
              {status === 'simpleRunning' ? 'IN FLIGHT...' : 'LAUNCH'}
            </button>

            {/* Simple Reset Button */}
            {(status === 'crashed' || status === 'landed' || status === 'simpleRunning') && (
              <button
                onClick={handleSimpleReset}
                className="mission-btn w-full rounded py-2 text-xs"
              >
                ↺ Reset
              </button>
            )}
          </>
        )}

        {/* G-FOLD Controls */}
        {simulationMode === 'gfold' && (
          <>
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

            {/* Environment Selection */}
            <div>
              <label className="data-label block mb-2">Landing Environment</label>
              <select
                className="mission-select w-full rounded px-3 py-2 text-sm"
                value={environmentType}
                onChange={(e) => setEnvironmentType(e.target.value as EnvironmentType)}
              >
                {environmentOptions.map((env) => (
                  <option key={env.value} value={env.value}>
                    {env.label}
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

            {/* Launch Button */}
            <button
              onClick={handleLaunch}
              disabled={status === 'launching' || status === 'solving'}
              className="mission-btn w-full rounded py-3 text-sm bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold tracking-wider"
            >
              {status === 'launching' ? 'LAUNCHING...' : 'LAUNCH MISSION'}
            </button>

            {/* Solve Button (direct landing) */}
            <button
              onClick={handleSolve}
              disabled={status === 'solving' || status === 'launching'}
              className="mission-btn w-full rounded py-2 text-xs opacity-70 hover:opacity-100"
            >
              {status === 'solving' ? 'Computing...' : 'Skip to Landing Only'}
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
          </>
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
            <label className="flex items-center gap-3 text-xs text-amber-500/70 cursor-pointer hover:text-amber-500 transition-colors">
              <input
                type="checkbox"
                checked={showGlideslopeCone}
                onChange={toggleGlideslopeCone}
              />
              Glide Slope Cone
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
