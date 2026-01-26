<template lang="pug">
.battle-arena-overlay(v-if="store.isBattleActive")
  .battle-container(ref="container")
  .battle-ui
    .battle-title {{ battleTitle }}
    button.skip-button(@click="skipBattle") Skip Battle
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { useGameStore } from '~/stores/game'
import type { BattleState } from '~/stores/game'

export default defineComponent({
  name: 'BattleArena',
  
  setup() {
    const store = useGameStore()
    const container = ref<HTMLDivElement | null>(null)

    // Three.js variables
    let scene: THREE.Scene
    let camera: THREE.PerspectiveCamera
    let renderer: THREE.WebGLRenderer
    let animationId: number

    // Piece meshes in battle
    let attackerMesh: THREE.Mesh | null = null
    let defenderMesh: THREE.Mesh | null = null

    const battleTitle = computed(() => {
      if (!store.battle.attacker || !store.battle.defender) return ''
      const attackerName = getPieceName(store.battle.attacker.type)
      const defenderName = getPieceName(store.battle.defender.type)
      return `${attackerName} vs ${defenderName}`
    })

    function getPieceName(type: string): string {
      const names: Record<string, string> = {
        p: 'Pawn',
        r: 'Rook',
        n: 'Knight',
        b: 'Bishop',
        q: 'Queen',
        k: 'King',
      }
      return names[type] || 'Piece'
    }

    function initBattleScene() {
      if (!container.value) return

      // Scene
      scene = new THREE.Scene()
      scene.background = new THREE.Color(0x0a0a0a)
      scene.fog = new THREE.Fog(0x0a0a0a, 20, 60)

      // Camera
      const aspect = container.value.clientWidth / container.value.clientHeight
      camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100)
      camera.position.set(0, 8, 20)
      camera.lookAt(0, 3, 0)

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(container.value.clientWidth, container.value.clientHeight)
      renderer.shadowMap.enabled = true
      container.value.appendChild(renderer.domElement)

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
      scene.add(ambientLight)

      const spotLight = new THREE.SpotLight(0xffd700, 1.5)
      spotLight.position.set(0, 20, 0)
      spotLight.castShadow = true
      spotLight.angle = Math.PI / 4
      scene.add(spotLight)

      const rimLight = new THREE.DirectionalLight(0xff6600, 0.5)
      rimLight.position.set(-10, 5, -10)
      scene.add(rimLight)

      // Arena ground
      const groundGeometry = new THREE.CircleGeometry(15, 32)
      const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2a2520,
        roughness: 0.8,
      })
      const ground = new THREE.Mesh(groundGeometry, groundMaterial)
      ground.rotation.x = -Math.PI / 2
      ground.receiveShadow = true
      scene.add(ground)

      // Create battle pieces
      createBattlePieces()

      // Animation loop
      animate()
    }

    function createBattlePieces() {
      if (!store.battle.attacker || !store.battle.defender) return

      // Attacker (left side)
      attackerMesh = createPieceMesh(
        store.battle.attacker.type,
        store.battle.attacker.color
      )
      attackerMesh.position.set(-8, 0, 0)
      scene.add(attackerMesh)

      // Defender (right side)
      defenderMesh = createPieceMesh(
        store.battle.defender.type,
        store.battle.defender.color
      )
      defenderMesh.position.set(8, 0, 0)
      scene.add(defenderMesh)

      // Start battle animation
      playBattleAnimation()
    }

    function createPieceMesh(type: string, color: string) {
      let geometry: THREE.BufferGeometry

      switch (type) {
        case 'p': geometry = new THREE.CylinderGeometry(1, 1, 3, 16); break
        case 'r': geometry = new THREE.BoxGeometry(3, 5, 3); break
        case 'n': geometry = new THREE.CylinderGeometry(0.5, 2, 5, 4); break
        case 'b': geometry = new THREE.CapsuleGeometry(1.5, 3, 4, 8); break
        case 'q': geometry = new THREE.CylinderGeometry(2, 1, 7, 16); break
        case 'k': geometry = new THREE.CylinderGeometry(2, 2, 8, 8); break
        default: geometry = new THREE.BoxGeometry(2, 2, 2)
      }

      const material = new THREE.MeshStandardMaterial({
        color: color === 'w' ? 0xeeeeee : 0x222222,
        roughness: 0.3,
        metalness: 0.4,
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      
      // Set Y position based on piece height
      const height = getGeometryHeight(geometry)
      mesh.position.y = height / 2

      return mesh
    }

    function getGeometryHeight(geometry: THREE.BufferGeometry): number {
      geometry.computeBoundingBox()
      const box = geometry.boundingBox!
      return box.max.y - box.min.y
    }

    async function playBattleAnimation() {
      if (!attackerMesh || !defenderMesh) return

      // Simple animation: attacker charges forward
      const startX = attackerMesh.position.x
      const targetX = defenderMesh.position.x - 3
      const duration = 800 // ms
      const startTime = Date.now()

      return new Promise<void>((resolve) => {
        function animateCharge() {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)
          
          // Ease-out
          const eased = 1 - Math.pow(1 - progress, 3)
          
          attackerMesh!.position.x = startX + (targetX - startX) * eased
          
          // Add slight rotation
          attackerMesh!.rotation.y = Math.sin(progress * Math.PI * 2) * 0.2

          if (progress < 1) {
            requestAnimationFrame(animateCharge)
          } else {
            // Impact! Add particles here later
            setTimeout(() => {
              // Defender disappears
              if (defenderMesh) {
                scene.remove(defenderMesh)
              }
              
              // Wait a moment then end battle
              setTimeout(() => {
                endBattle()
                resolve()
              }, 500)
            }, 200)
          }
        }

        animateCharge()
      })
    }

    function animate() {
      animationId = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }

    function skipBattle() {
      endBattle()
    }

    function endBattle() {
      // Clean up scene
      if (attackerMesh) scene.remove(attackerMesh)
      if (defenderMesh) scene.remove(defenderMesh)
      
      // Complete battle in store
      store.completeBattle()
    }

    function onWindowResize() {
      if (!container.value) return
      camera.aspect = container.value.clientWidth / container.value.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.value.clientWidth, container.value.clientHeight)
    }

    // Watch for battle activation
    watch(() => store.isBattleActive, (isActive) => {
      if (isActive && container.value) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          initBattleScene()
        }, 100)
      }
    })

    onMounted(() => {
      window.addEventListener('resize', onWindowResize)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', onWindowResize)
      if (animationId) cancelAnimationFrame(animationId)
      if (renderer) renderer.dispose()
    })

    return {
      store,
      container,
      battleTitle,
      skipBattle,
    }
  }
})
</script>

<style lang="less" scoped>
.battle-arena-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.battle-container {
  width: 90%;
  max-width: 1200px;
  height: 70vh;
  border: 4px solid @primary-gold;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(207, 167, 110, 0.5);
}

.battle-ui {
  margin-top: 20px;
  text-align: center;
}

.battle-title {
  font-size: 2rem;
  color: @primary-gold;
  font-family: 'Times New Roman', serif;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 20px;
  text-shadow: 0 0 10px rgba(207, 167, 110, 0.8);
}

.skip-button {
  padding: 12px 30px;
  background: @secondary-brown;
  color: white;
  border: 2px solid @primary-gold;
  border-radius: 4px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: @primary-gold;
    color: @background-dark;
    transform: scale(1.05);
  }
}
</style>
