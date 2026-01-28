import gsap from 'gsap'
import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export const CAMERA_DEFAULTS = {
  position: { x: 0, y: 80, z: 80 },
  target: { x: 0, y: 0, z: 0 }
}

export function animateCamera(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  targetPos: THREE.Vector3,
  targetLookAt: THREE.Vector3,
  duration: number = 1.5
) {
  // Animate camera position
  gsap.to(camera.position, {
    x: targetPos.x,
    y: targetPos.y,
    z: targetPos.z,
    duration: duration,
    ease: 'power2.inOut',
    onUpdate: () => {
      camera.updateProjectionMatrix()
    }
  })

  // Animate OrbitControls target
  gsap.to(controls.target, {
    x: targetLookAt.x,
    y: targetLookAt.y,
    z: targetLookAt.z,
    duration: duration,
    ease: 'power2.inOut',
    onUpdate: () => {
      controls.update()
    }
  })
}

export function zoomToBattle(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  attackerSq: string,
  defenderSq: string,
  squareSize: number,
  boardSize: number
) {
  const getCoords = (sq: string) => {
    const file = sq.charCodeAt(0) - 97
    const rank = parseInt(sq[1] || '0')
    const z = 8 - rank
    const x = file
    const offset = (boardSize / 2) - (squareSize / 2)
    return {
      x: (x * squareSize) - offset,
      z: (z * squareSize) - offset
    }
  }

  const attacker = getCoords(attackerSq)
  const defender = getCoords(defenderSq)

  // Midpoint for looking at
  const midX = (attacker.x + defender.x) / 2
  const midZ = (attacker.z + defender.z) / 2
  const lookAt = new THREE.Vector3(midX, 5, midZ)

  // Camera position (zoom in and slightly to the side)
  // Distance from midpoint
  const dist = 30
  const angle = Math.atan2(attacker.z - defender.z, attacker.x - defender.x) + Math.PI / 2

  const camX = midX + Math.cos(angle) * dist
  const camZ = midZ + Math.sin(angle) * dist
  const camY = 20

  animateCamera(camera, controls, new THREE.Vector3(camX, camY, camZ), lookAt)
}

export function resetCamera(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls
) {
  animateCamera(
    camera,
    controls,
    new THREE.Vector3(CAMERA_DEFAULTS.position.x, CAMERA_DEFAULTS.position.y, CAMERA_DEFAULTS.position.z),
    new THREE.Vector3(CAMERA_DEFAULTS.target.x, CAMERA_DEFAULTS.target.y, CAMERA_DEFAULTS.target.z)
  )
}
