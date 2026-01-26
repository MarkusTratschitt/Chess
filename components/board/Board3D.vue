<template lang="pug">
.three-container(ref="container")
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useGameStore } from '~/stores/game'

export default defineComponent({
  name: 'Board3D',
  
  setup() {
    const container = ref<HTMLDivElement | null>(null)
    const store = useGameStore()

    // Three.js variables
    let scene: THREE.Scene
    let camera: THREE.PerspectiveCamera
    let renderer: THREE.WebGLRenderer
    let controls: OrbitControls
    let animationId: number

    // Constants
    const SQUARE_SIZE = 10
    const BOARD_SIZE = SQUARE_SIZE * 8

    // Piece meshes tracking
    const pieceMeshes: THREE.Mesh[] = []
    const meshUserData = new WeakMap<THREE.Object3D, { x: number; z: number; type: string; color: string }>()
    const selectedSquare = ref<{ x: number; z: number } | null>(null)

    // Initialize Three.js scene
    function initThree() {
      if (!container.value) return

      // Scene
      scene = new THREE.Scene()
      scene.background = new THREE.Color(0x1a1815)
      scene.fog = new THREE.Fog(0x1a1815, 50, 200)

      // Camera
      const aspect = container.value.clientWidth / container.value.clientHeight
      camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000)
      camera.position.set(0, 80, 80)
      camera.lookAt(0, 0, 0)

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(container.value.clientWidth, container.value.clientHeight)
      renderer.shadowMap.enabled = true
      container.value.appendChild(renderer.domElement)

      // Controls
      controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.minDistance = 40
      controls.maxDistance = 150

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
      scene.add(ambientLight)

      const dirLight = new THREE.DirectionalLight(0xffd700, 1)
      dirLight.position.set(50, 100, 50)
      dirLight.castShadow = true
      scene.add(dirLight)

      // Board
      createBoard()

      // Pieces
      updatePieces()

      // Interaction
      const raycaster = new THREE.Raycaster()
      const mouse = new THREE.Vector2()

      function onPointerDown(event: MouseEvent) {
        const rect = container.value!.getBoundingClientRect()
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObjects(scene.children)

        if (intersects.length > 0) {
          const object = intersects[0].object
          const isPiece = pieceMeshes.includes(object as THREE.Mesh)

          if (isPiece) {
            handlePieceClick(object as THREE.Mesh)
          } else if (object.userData.type === 'square') {
            handleSquareClick(object.userData.x, object.userData.z)
          }
        } else {
          selectedSquare.value = null
          highlightValidMoves([])
        }
      }

      container.value.addEventListener('pointerdown', onPointerDown)

      // Animation loop
      animate()
    }

    function createBoard() {
      const geometry = new THREE.BoxGeometry(SQUARE_SIZE, 2, SQUARE_SIZE)
      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xdebb87 })
      const blackMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 })

      const offset = (BOARD_SIZE / 2) - (SQUARE_SIZE / 2)

      for (let x = 0; x < 8; x++) {
        for (let z = 0; z < 8; z++) {
          const isWhite = (x + z) % 2 === 0
          const mesh = new THREE.Mesh(geometry, isWhite ? whiteMat : blackMat)

          mesh.position.set(
            (x * SQUARE_SIZE) - offset,
            0,
            (z * SQUARE_SIZE) - offset
          )
          mesh.receiveShadow = true
          mesh.userData = { x, z, type: 'square' }
          scene.add(mesh)
        }
      }
    }

    function updatePieces() {
      pieceMeshes.forEach(mesh => scene.remove(mesh))
      pieceMeshes.length = 0

      const board = store.board
      const offset = (BOARD_SIZE / 2) - (SQUARE_SIZE / 2)

      board.forEach((row, rowIndex) => {
        row.forEach((piece, colIndex) => {
          if (piece) {
            const pieceMesh = createPieceMesh(piece)
            pieceMesh.position.set(
              (colIndex * SQUARE_SIZE) - offset,
              PIECE_Y_OFFSET(piece.type),
              (rowIndex * SQUARE_SIZE) - offset
            )
            scene.add(pieceMesh)
            pieceMeshes.push(pieceMesh)

            meshUserData.set(pieceMesh, {
              x: colIndex,
              z: rowIndex,
              type: piece.type,
              color: piece.color
            })
          }
        })
      })
    }

    function PIECE_Y_OFFSET(type: string) {
      switch (type) {
        case 'p': return 1 + 2
        case 'r': return 1 + 3
        case 'n': return 1 + 3
        case 'b': return 1 + 4
        case 'q': return 1 + 4.5
        case 'k': return 1 + 5
        default: return 3
      }
    }

    function createPieceMesh(piece: { type: string; color: string }) {
      let geometry: THREE.BufferGeometry

      switch (piece.type) {
        case 'p': geometry = new THREE.CylinderGeometry(2, 2, 4, 16); break
        case 'r': geometry = new THREE.BoxGeometry(4, 6, 4); break
        case 'n': geometry = new THREE.CylinderGeometry(1, 3, 6, 4); break
        case 'b': geometry = new THREE.CapsuleGeometry(2, 4, 4, 8); break
        case 'q': geometry = new THREE.CylinderGeometry(3, 1, 9, 16); break
        case 'k': geometry = new THREE.CylinderGeometry(3, 3, 10, 8); break
        default: geometry = new THREE.BoxGeometry(2, 2, 2)
      }

      const material = new THREE.MeshStandardMaterial({
        color: piece.color === 'w' ? 0xeeeeee : 0x333333,
        roughness: 0.3,
        metalness: 0.2
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      return mesh
    }

    function handlePieceClick(mesh: THREE.Mesh) {
      const data = meshUserData.get(mesh)
      if (!data) return

      if (data.color === store.turn) {
        selectedSquare.value = { x: data.x, z: data.z }
        const squareName = toSquare(data.x, data.z)
        const moves = store.getValidMoves(squareName as any)
        highlightValidMoves(moves.map(m => m.to))
      } else {
        if (selectedSquare.value) {
          attemptMove(data.x, data.z)
        }
      }
    }

    function handleSquareClick(x: number, z: number) {
      if (selectedSquare.value) {
        attemptMove(x, z)
      }
    }

    function attemptMove(toX: number, toZ: number) {
      if (!selectedSquare.value) return

      const from = toSquare(selectedSquare.value.x, selectedSquare.value.z)
      const to = toSquare(toX, toZ)

      const success = store.makeMove({ from, to, promotion: 'q' })
      if (success) {
        selectedSquare.value = null
        highlightValidMoves([])
      } else {
        selectedSquare.value = null
        highlightValidMoves([])
      }
    }

    function toSquare(x: number, z: number) {
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
      const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']
      return `${files[x]}${ranks[z]}`
    }

    function highlightValidMoves(squares: string[]) {
      const highlightGroup = scene.getObjectByName('highlights')
      if (highlightGroup) scene.remove(highlightGroup)

      if (squares.length === 0) return

      const group = new THREE.Group()
      group.name = 'highlights'

      const geometry = new THREE.PlaneGeometry(SQUARE_SIZE * 0.9, SQUARE_SIZE * 0.9)
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00, 
        transparent: true, 
        opacity: 0.5, 
        side: THREE.DoubleSide 
      })
      geometry.rotateX(-Math.PI / 2)

      const offset = (BOARD_SIZE / 2) - (SQUARE_SIZE / 2)

      squares.forEach(sq => {
        const file = sq.charCodeAt(0) - 97
        const rank = parseInt(sq[1])
        const z = 8 - rank
        const x = file

        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(
          (x * SQUARE_SIZE) - offset,
          1.1,
          (z * SQUARE_SIZE) - offset
        )
        group.add(mesh)
      })

      scene.add(group)
    }

    function animate() {
      animationId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }

    function onWindowResize() {
      if (!container.value) return
      camera.aspect = container.value.clientWidth / container.value.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.value.clientWidth, container.value.clientHeight)
    }

    // Watch for FEN changes
    watch(() => store.fen, () => {
      updatePieces()
    })

    onMounted(() => {
      initThree()
      window.addEventListener('resize', onWindowResize)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', onWindowResize)
      cancelAnimationFrame(animationId)
      if (renderer) renderer.dispose()
    })

    return {
      container
    }
  }
})
</script>

<style lang="less" scoped>
.three-container {
  width: 100%;
  height: 600px;
  border: 4px solid @primary-gold;
  border-radius: 8px;
  overflow: hidden;
}
</style>
