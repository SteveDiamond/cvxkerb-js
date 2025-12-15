import {
  variable,
  constant,
  add,
  sub,
  mul,
  index,
  norm2,
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

// Helper to extract vector values from solution
function extractVector(solution: Solution, expr: Expr): [number, number, number] {
  if (!solution.primal || expr.kind !== 'variable') {
    return [0, 0, 0];
  }
  const values = solution.primal.get(expr.id);
  if (!values) {
    return [0, 0, 0];
  }
  return [values[0], values[1], values[2]];
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

  // Decision variables: arrays of 3-vectors (one per timestep)
  const V: Expr[] = Array.from({ length: K + 1 }, () => variable(3));
  const P: Expr[] = Array.from({ length: K + 1 }, () => variable(3));
  const F: Expr[] = Array.from({ length: K }, () => variable(3));

  const constraints: Constraint[] = [];

  // === BOUNDARY CONDITIONS ===
  constraints.push(eq(V[0], constant(v0)));
  constraints.push(eq(P[0], constant(p0)));
  constraints.push(eq(V[K], constant([0, 0, 0])));
  constraints.push(eq(P[K], constant(p_target)));

  // === DYNAMICS ===
  const gravityImpulse = constant([0, 0, h * g]);
  for (let k = 0; k < K; k++) {
    // Velocity update: V[k+1] = V[k] + (h/m)*F[k] - [0,0,h*g]
    constraints.push(eq(
      V[k + 1],
      sub(add(V[k], mul(h / m, F[k])), gravityImpulse)
    ));
    // Position update (trapezoidal): P[k+1] = P[k] + (h/2)*(V[k] + V[k+1])
    constraints.push(eq(
      P[k + 1],
      add(P[k], mul(h / 2, add(V[k], V[k + 1])))
    ));
  }

  // === OPERATIONAL CONSTRAINTS ===
  for (let k = 0; k <= K; k++) {
    // Min altitude: P[k][2] >= P_min
    constraints.push(ge(index(P[k], 2), P_min));
    // Descending: V[k][2] <= 0
    constraints.push(le(index(V[k], 2), 0));
  }
  for (let k = 0; k < K; k++) {
    // Upward thrust: F[k][2] >= 0
    constraints.push(ge(index(F[k], 2), 0));
    // Thrust magnitude: ||F[k]||_2 <= F_max (SOCP!)
    constraints.push(soc(F[k], F_max));
  }

  // === OBJECTIVE: Minimize fuel ===
  let fuelCost: Expr = norm2(F[0]);
  for (let k = 1; k < K; k++) {
    fuelCost = add(fuelCost, norm2(F[k]));
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
    positions.push(extractVector(solution, P[k]));
    velocities.push(extractVector(solution, V[k]));
  }

  for (let k = 0; k < K; k++) {
    thrusts.push(extractVector(solution, F[k]));
  }

  return {
    positions,
    velocities,
    thrusts,
    fuelUsed: solution.value ?? 0,
  };
}
