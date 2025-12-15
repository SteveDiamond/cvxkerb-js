import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useCameraStore, type CameraMode } from '../../stores/cameraStore';

interface CameraControllerProps {
  rocketPosition: [number, number, number];
  rocketVelocity?: [number, number, number];
  targetPosition: [number, number, number];
}

export function CameraController({
  rocketPosition,
  rocketVelocity = [0, 0, 0],
  targetPosition,
}: CameraControllerProps) {
  const { activeCamera, isTransitioning, transitionProgress, updateTransition, completeTransition } =
    useCameraStore();

  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const targetPosRef = useRef(new THREE.Vector3());
  const currentPosRef = useRef(new THREE.Vector3(500, 300, 800));
  const currentLookAtRef = useRef(new THREE.Vector3());
  const transitionStartPos = useRef(new THREE.Vector3());
  const transitionStartLookAt = useRef(new THREE.Vector3());

  // Get target camera position and look-at based on mode
  const getCameraConfig = (
    mode: CameraMode,
    rocketPos: THREE.Vector3,
    velocity: THREE.Vector3
  ): { position: THREE.Vector3; lookAt: THREE.Vector3 } => {
    switch (mode) {
      case 'chase': {
        // Behind and above the rocket, looking at it
        // Three.js: y is up, x/z are horizontal
        const behindDistance = 150;
        const aboveDistance = 80;

        // Position camera behind (in x/z plane) and above (in y)
        let offset = new THREE.Vector3(-behindDistance, aboveDistance, 0);

        // Rotate offset based on velocity direction for dynamic chase
        if (velocity.length() > 1) {
          const horizontalVel = new THREE.Vector2(velocity.x, velocity.z);
          if (horizontalVel.length() > 0.1) {
            const angle = Math.atan2(velocity.z, velocity.x);
            offset = new THREE.Vector3(
              -behindDistance * Math.cos(angle),
              aboveDistance,
              -behindDistance * Math.sin(angle)
            );
          }
        }

        return {
          position: rocketPos.clone().add(offset),
          lookAt: rocketPos.clone(),
        };
      }

      case 'ground': {
        // Fixed position near landing pad, looking up at rocket
        const groundPos = new THREE.Vector3(
          targetPosition[0] + 150,
          10,
          targetPosition[2] + 150
        );
        return {
          position: groundPos,
          lookAt: rocketPos.clone(),
        };
      }

      case 'tracking': {
        // Side view that tracks horizontally with rocket
        return {
          position: new THREE.Vector3(rocketPos.x + 300, rocketPos.z * 0.3 + 100, 0),
          lookAt: rocketPos.clone(),
        };
      }

      case 'engine': {
        // Below the rocket looking down at ground
        const engineOffset = new THREE.Vector3(0, -60, 0);
        const camPos = rocketPos.clone().add(engineOffset);
        // Look straight down
        return {
          position: camPos,
          lookAt: new THREE.Vector3(rocketPos.x, 0, rocketPos.z),
        };
      }

      case 'orbit':
      default: {
        // Keep current position for orbit mode (OrbitControls handles it)
        return {
          position: currentPosRef.current.clone(),
          lookAt: new THREE.Vector3(0, 0, 200),
        };
      }
    }
  };

  // Handle transition start
  useEffect(() => {
    if (isTransitioning) {
      transitionStartPos.current.copy(currentPosRef.current);
      transitionStartLookAt.current.copy(currentLookAtRef.current);
    }
  }, [isTransitioning]);

  useFrame((_, delta) => {
    if (!cameraRef.current || activeCamera === 'orbit') return;

    const rocketPos = new THREE.Vector3(...rocketPosition);
    const velocity = new THREE.Vector3(...rocketVelocity);

    const config = getCameraConfig(activeCamera, rocketPos, velocity);
    targetPosRef.current.copy(config.position);

    // Handle transitions
    if (isTransitioning) {
      const newProgress = Math.min(transitionProgress + delta * 2, 1); // 0.5s transition
      updateTransition(newProgress);

      if (newProgress >= 1) {
        completeTransition();
      }

      // Smooth interpolation during transition
      const t = easeInOutCubic(newProgress);
      currentPosRef.current.lerpVectors(transitionStartPos.current, config.position, t);
      currentLookAtRef.current.lerpVectors(transitionStartLookAt.current, config.lookAt, t);
    } else {
      // Smooth follow with lag
      const lagFactor = activeCamera === 'chase' ? 0.05 : 0.1;
      currentPosRef.current.lerp(config.position, lagFactor);
      currentLookAtRef.current.lerp(config.lookAt, 0.1);
    }

    // Prevent camera from going below ground
    const minCameraHeight = 10;
    if (currentPosRef.current.y < minCameraHeight) {
      currentPosRef.current.y = minCameraHeight;
    }

    // Apply to camera
    cameraRef.current.position.copy(currentPosRef.current);
    cameraRef.current.lookAt(currentLookAtRef.current);
  });

  // Only render programmatic camera for non-orbit modes
  if (activeCamera === 'orbit') {
    return null;
  }

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={60}
      near={1}
      far={8000}
      position={[500, 300, 800]}
    />
  );
}

// Easing function for smooth transitions
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
