// Camera transition utilities for battle animations
// NOTE: GSAP needs to be installed: npm install gsap

import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export interface CameraTransition {
  position: { x: number; y: number; z: number }
  lookAt: { x: number; y: number; z: number }
  duration: number
}

/**
 * Animate camera to battle view
 * Uses GSAP for smooth transitions (install with: npm install gsap)
 */
export async function transitionToBattleView(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  battlePosition: THREE.Vector3
): Promise<void> {
  // Disable controls during transition
  controls.enabled = false

  // Battle camera position (closer, lower angle)
  const targetPosition = new THREE.Vector3(
    battlePosition.x + 15,
    battlePosition.y + 10,
    battlePosition.z + 15
  )

  const targetLookAt = battlePosition.clone()

  // For now, use simple lerp animation (GSAP would be smoother)
  // TODO: Replace with GSAP when installed
  return new Promise((resolve) => {
    const startPos = camera.position.clone()
    const startTarget = controls.target.clone()
    const duration = 1000 // ms
    const startTime = Date.now()

    function animate() {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease-in-out
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2

      camera.position.lerpVectors(startPos, targetPosition, eased)
      controls.target.lerpVectors(startTarget, targetLookAt, eased)
      controls.update()

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        resolve()
      }
    }

    animate()
  })
}

/**
 * Animate camera back to board view
 */
export async function transitionToBoardView(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  boardPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
): Promise<void> {
  // Board camera position (original view)
  const targetPosition = new THREE.Vector3(0, 80, 80)
  const targetLookAt = boardPosition

  return new Promise((resolve) => {
    const startPos = camera.position.clone()
    const startTarget = controls.target.clone()
    const duration = 1000 // ms
    const startTime = Date.now()

    function animate() {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2

      camera.position.lerpVectors(startPos, targetPosition, eased)
      controls.target.lerpVectors(startTarget, targetLookAt, eased)
      controls.update()

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // Re-enable controls
        controls.enabled = true
        resolve()
      }
    }

    animate()
  })
}

/**
 * Get battle arena position (center of the board, elevated)
 */
export function getBattleArenaPosition(): THREE.Vector3 {
  return new THREE.Vector3(0, 5, 0)
}
