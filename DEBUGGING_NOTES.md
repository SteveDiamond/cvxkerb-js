# Debugging Notes - Rocket Landing Demo

## Changes Made

### 1. Stars - STILL NOT WORKING
**File:** `src/components/Scene.tsx` line 107

Changed from:
```tsx
<Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={0} />
```

To:
```tsx
<Stars radius={5000} depth={500} count={8000} factor={6} saturation={0} fade speed={0} />
```

**Status:** Stars are still not visible. The sky area appears as pure black `#030308`.

**Possible causes to investigate:**
1. The `Stars` component from `@react-three/drei` might be rendering but too dim
2. The Mars terrain/atmosphere lighting might be washing out the stars
3. The stars might be behind the Mars surface geometry
4. The `fade` prop might be fading them out at camera distance
5. Could need explicit render order or depth settings
6. The `factor={6}` might still be too small for star point size at this distance

**Things to try:**
- Remove `fade` prop to prevent distance fading
- Increase `factor` to 10+ for larger star points
- Check if stars render without the Mars environment
- Add `transparent={false}` or explicit material settings
- Check z-fighting or render order issues
- Try adding stars as a separate layer/scene

### 2. Rocket Color - WORKING
**File:** `src/components/Rocket.tsx` lines 46-51

Changed from bright silver to darker matte:
```tsx
child.material = new THREE.MeshStandardMaterial({
  color: '#606060',      // Darker gray (was #e8e8e8)
  metalness: 0.2,        // Less metallic (was 0.9)
  roughness: 0.75,       // Matte finish (was 0.35)
  envMapIntensity: 0.3,  // Reduced reflections (was 1.0)
});
```

**Status:** Working - rocket now has darker matte appearance as requested.

### 3. Rocket Orientation - NEEDS VERIFICATION
**File:** `src/components/Rocket.tsx` lines 71-112

Added `lastThrustDir` ref and enhanced orientation logic:
- Points in thrust direction during powered flight
- Maintains last orientation during coast phase
- Uses 5000N threshold for detecting powered vs coast
- Different lerp factors for active control vs drifting

**Status:** The rocket appears to be tilted during descent which looks more realistic. However, need user verification that:
1. The initial orientation is correct (should rocket start tilted based on incoming trajectory?)
2. The rotation during descent looks realistic
3. The transition from powered to coast maintains proper orientation

**Key question:** The current logic points rocket in THRUST direction. In a real powered descent:
- Thrust is applied opposite to velocity to slow down
- This means rocket points "backward" relative to motion
- Is this what user expects, or should rocket initially point along VELOCITY (nose-first like an airplane)?

## Current Understanding of the Physics

### G-FOLD Solver Output
- Computes optimal thrust vectors `F[k]` at each timestep
- Physics coordinates: `[x, y, z]` where z = altitude
- Three.js coordinates: `[x, y, z]` where y = up
- Conversion: `thrustVector = [f[0], f[2], f[1]]` (swap y/z)

### Python Reference (ksp_landing.py)
```python
direction = target_F / np.linalg.norm(target_F)  # Thrust direction
target_pitch = np.arctan2(direction[2], xy_len)   # Pitch from thrust
```
The rocket points WHERE THE THRUST IS DIRECTED, not where it's going.

### Scenario Initial Conditions
```
p0: [600, 100, 1500]     # Position: x=600, y=100, z(alt)=1500
v0: [-80, -20, -120]     # Velocity: coming in at angle, mostly downward
```

Initial velocity converted to Three.js: `[-80, -120, -20]` (x, y-up, z)
This means rocket is falling mostly down (-Y) and toward pad (-X).

## Next Steps

1. **Fix stars:** Try different approaches - maybe simpler custom star field, or debug why drei Stars isn't showing
2. **Verify orientation:** Have user run simulation and confirm orientation behavior matches expectations
3. **Test edge cases:** What happens at start before thrust? What happens at landing?

## Console Output
- No JavaScript errors
- MOLA heightmap loading successfully
- No warnings about Stars component
