import {
  variable,
  constant,
  add,
  sub,
  mul,
  norm2,
  vstack,
  eq,
  ge,
  le,
  soc,
  Problem,
  loadWasm,
  type Expr,
  type Constraint,
  type Solution,
} from 'cvxjs';
import type { LandingParams, TrajectoryData } from '../stores/simulationStore';

// Helper to extract scalar value from solution
function extractScalar(solution: Solution, expr: Expr): number {
  if (!solution.primal || expr.kind !== 'variable') {
    return 0;
  }
  const values = solution.primal.get(expr.id);
  if (!values || values.length === 0) {
    return 0;
  }
  return values[0];
}

let wasmLoaded = false;

export async function initSolver(): Promise<void> {
  if (!wasmLoaded) {
    await loadWasm();
    wasmLoaded = true;
  }
}

export async function solveLanding(params: LandingParams): Promise<TrajectoryData> {
  await initSolver();

  const { K, h, g, m, F_max, P_min, p0, v0, p_target } = params;

  // Decision variables: separate scalars for each component
  // This avoids using index() which isn't canonicalized yet
  const Vx: Expr[] = Array.from({ length: K + 1 }, () => variable(1));
  const Vy: Expr[] = Array.from({ length: K + 1 }, () => variable(1));
  const Vz: Expr[] = Array.from({ length: K + 1 }, () => variable(1));

  const Px: Expr[] = Array.from({ length: K + 1 }, () => variable(1));
  const Py: Expr[] = Array.from({ length: K + 1 }, () => variable(1));
  const Pz: Expr[] = Array.from({ length: K + 1 }, () => variable(1));

  const Fx: Expr[] = Array.from({ length: K }, () => variable(1));
  const Fy: Expr[] = Array.from({ length: K }, () => variable(1));
  const Fz: Expr[] = Array.from({ length: K }, () => variable(1));

  const constraints: Constraint[] = [];

  // === BOUNDARY CONDITIONS ===
  // Initial velocity
  constraints.push(eq(Vx[0], constant(v0[0])));
  constraints.push(eq(Vy[0], constant(v0[1])));
  constraints.push(eq(Vz[0], constant(v0[2])));

  // Initial position
  constraints.push(eq(Px[0], constant(p0[0])));
  constraints.push(eq(Py[0], constant(p0[1])));
  constraints.push(eq(Pz[0], constant(p0[2])));

  // Final velocity = 0 (soft landing)
  constraints.push(eq(Vx[K], constant(0)));
  constraints.push(eq(Vy[K], constant(0)));
  constraints.push(eq(Vz[K], constant(0)));

  // Final position = landing pad
  constraints.push(eq(Px[K], constant(p_target[0])));
  constraints.push(eq(Py[K], constant(p_target[1])));
  constraints.push(eq(Pz[K], constant(p_target[2])));

  // === DYNAMICS ===
  for (let k = 0; k < K; k++) {
    // Velocity update: V[k+1] = V[k] + (h/m)*F[k] - [0,0,h*g]
    // Horizontal (no gravity)
    constraints.push(eq(Vx[k + 1], add(Vx[k], mul(h / m, Fx[k]))));
    constraints.push(eq(Vy[k + 1], add(Vy[k], mul(h / m, Fy[k]))));
    // Vertical (with gravity)
    constraints.push(eq(Vz[k + 1], sub(add(Vz[k], mul(h / m, Fz[k])), constant(h * g))));

    // Position update (trapezoidal): P[k+1] = P[k] + (h/2)*(V[k] + V[k+1])
    constraints.push(eq(Px[k + 1], add(Px[k], mul(h / 2, add(Vx[k], Vx[k + 1])))));
    constraints.push(eq(Py[k + 1], add(Py[k], mul(h / 2, add(Vy[k], Vy[k + 1])))));
    constraints.push(eq(Pz[k + 1], add(Pz[k], mul(h / 2, add(Vz[k], Vz[k + 1])))));
  }

  // === OPERATIONAL CONSTRAINTS ===
  for (let k = 0; k <= K; k++) {
    // Min altitude: Pz[k] >= P_min
    constraints.push(ge(Pz[k], P_min));
    // Descending: Vz[k] <= 0
    constraints.push(le(Vz[k], 0));
  }

  for (let k = 0; k < K; k++) {
    // Upward thrust: Fz[k] >= 0
    constraints.push(ge(Fz[k], 0));
    // Thrust magnitude: ||F[k]||_2 <= F_max (SOCP!)
    // Stack [Fx, Fy, Fz] into a vector for norm2
    const F_vec = vstack([Fx[k], Fy[k], Fz[k]]);
    constraints.push(soc(F_vec, F_max));
  }

  // === OBJECTIVE: Minimize fuel (sum of thrust magnitudes) ===
  let fuelCost: Expr = norm2(vstack([Fx[0], Fy[0], Fz[0]]));
  for (let k = 1; k < K; k++) {
    fuelCost = add(fuelCost, norm2(vstack([Fx[k], Fy[k], Fz[k]])));
  }

  const solution = await Problem.minimize(fuelCost)
    .subjectTo(constraints)
    .solve();

  if (solution.status !== 'optimal') {
    throw new Error(`Solver failed with status: ${solution.status}`);
  }

  // Extract trajectory from solution
  const positions: [number, number, number][] = [];
  const velocities: [number, number, number][] = [];
  const thrusts: [number, number, number][] = [];

  for (let k = 0; k <= K; k++) {
    positions.push([
      extractScalar(solution, Px[k]),
      extractScalar(solution, Py[k]),
      extractScalar(solution, Pz[k]),
    ]);
    velocities.push([
      extractScalar(solution, Vx[k]),
      extractScalar(solution, Vy[k]),
      extractScalar(solution, Vz[k]),
    ]);
  }

  for (let k = 0; k < K; k++) {
    thrusts.push([
      extractScalar(solution, Fx[k]),
      extractScalar(solution, Fy[k]),
      extractScalar(solution, Fz[k]),
    ]);
  }

  return {
    positions,
    velocities,
    thrusts,
    fuelUsed: solution.value ?? 0,
  };
}
