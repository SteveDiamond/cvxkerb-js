# cvxkerb-js Setup Guide

## What We're Building

A stunning 3D browser-based rocket landing demo powered by cvxjs, implementing the G-FOLD algorithm (same approach SpaceX uses for Falcon 9 landings).

## Current Status

- [x] Created Vite + React + TypeScript project
- [x] Ran `npm install` for base dependencies
- [ ] Initialize git repo
- [ ] Create GitHub repo
- [ ] Install additional dependencies
- [ ] Build the app

## Next Steps (In Order)

### 1. Initialize Git Repo
```bash
cd /Users/stevend2/PythonProjects/cvxkerb-js
git init
git add -A
git commit -m "Initial commit: Vite + React + TypeScript scaffold"
```

### 2. Create GitHub Repo
```bash
gh repo create cvxkerb-js --public --source=. --push
```

### 3. Install Additional Dependencies
```bash
# 3D rendering
npm install three @react-three/fiber @react-three/drei

# State management
npm install zustand

# Your optimization library (link to local or use npm)
npm install ../cvxjs  # or: npm link cvxjs

# UI styling
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Types
npm install -D @types/three
```

### 4. Launch Claude in cvxkerb-js
```bash
cd /Users/stevend2/PythonProjects/cvxkerb-js
claude
```

Then tell Claude to continue with the plan at:
`/Users/stevend2/.claude/plans/delightful-whistling-biscuit.md`

## Project Structure (Target)

```
cvxkerb-js/
├── src/
│   ├── App.tsx                 # Main app with R3F Canvas
│   ├── main.tsx               # Entry point
│   ├── components/
│   │   ├── Scene.tsx          # 3D scene setup
│   │   ├── Rocket.tsx         # 3D rocket model
│   │   ├── LandingPad.tsx     # Landing target
│   │   ├── Trajectory.tsx     # Path visualization
│   │   └── ...
│   ├── simulation/
│   │   ├── GFoldSolver.ts     # G-FOLD using cvxjs
│   │   ├── dynamics.ts        # Physics
│   │   └── scenarios.ts       # Earth/Mars/Moon
│   ├── stores/
│   │   └── simulationStore.ts # Zustand state
│   └── ui/
│       ├── ControlPanel.tsx   # Parameters UI
│       └── Telemetry.tsx      # Data display
├── public/
├── package.json
├── vite.config.ts
└── index.html
```

## Key Files to Reference

- **Full plan**: `/Users/stevend2/.claude/plans/delightful-whistling-biscuit.md`
- **cvxjs source**: `/Users/stevend2/PythonProjects/cvxjs`
- **cvxkerb reference**: https://github.com/cvxpy/cvxkerb
