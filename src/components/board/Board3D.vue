<template>
  <div ref="container" class="three-container"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js' // Note: This might need specific import adjustment depending on types
import { useGameStore } from '../../game/store'

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

// Setup Scene
function initThree() {
  if (!container.value) return

  // 1. Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1815) // Match app background slightly
  scene.fog = new THREE.Fog(0x1a1815, 50, 200)

  // 2. Camera
  const aspect = container.value.clientWidth / container.value.clientHeight
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000)
  camera.position.set(0, 80, 80) // Isometric-ish view
  camera.lookAt(0, 0, 0)

  // 3. Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  renderer.shadowMap.enabled = true
  container.value.appendChild(renderer.domElement)

  // 4. Controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.minDistance = 40
  controls.maxDistance = 150

  // 5. Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const dirLight = new THREE.DirectionalLight(0xffd700, 1) // Goldish light like a torch/sun
  dirLight.position.set(50, 100, 50)
  dirLight.castShadow = true
  scene.add(dirLight)

  // 6. Board Geometry
  createBoard()
  
// 8. Interaction
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  function onPointerDown(event: MouseEvent) {
    // Calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components with respect to the canvas
    const rect = container.value!.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    // Intersect objects
    // We check both pieces and board squares
    const intersects = raycaster.intersectObjects(scene.children)

    if (intersects.length > 0) {
      // Get the first intersected object
      const object = intersects[0].object
      
      // Check if it's a piece (we didn't set userData explicitly on pieces yet, let's fix that or infer)
      // Actually we can check if it's in pieceMeshes
      const isPiece = pieceMeshes.includes(object as THREE.Mesh)
      
      if (isPiece) {
        handlePieceClick(object as THREE.Mesh)
      } else if (object.userData.type === 'square') {
        handleSquareClick(object.userData.x, object.userData.z)
      }
    } else {
        // Clicked background -> Deselect
        selectedSquare.value = null
        highlightValidMoves([])
    }
  }

  container.value.addEventListener('pointerdown', onPointerDown)

  // 9. Loop
  animate()
}

// Keep track of piece meshes to remove them on update
const pieceMeshes: THREE.Mesh[] = [] // Array of Meshes
// We need to map meshes back to board positions
const meshUserData = new WeakMap<THREE.Object3D, { x: number, z: number, type: string, color: string }>()

const selectedSquare = ref<{x: number, z: number} | null>(null)
const validMoveSquares: THREE.Mesh[] = [] // To clear highlights

function createBoard() {
  // ... (unchanged)
}

function updatePieces() {
  // Clear existing pieces
  pieceMeshes.forEach(mesh => scene.remove(mesh))
  pieceMeshes.length = 0

  const board = store.board // 8x8 array or nulls
  const offset = (BOARD_SIZE / 2) - (SQUARE_SIZE / 2)

  board.forEach((row, rowIndex) => {
    row.forEach((piece, colIndex) => {
      if (piece) {
        const pieceMesh = createPieceMesh(piece)
        pieceMesh.position.set(
            (colIndex * SQUARE_SIZE) - offset,
            // Height depends on piece type, but let's just createPieceMesh handle geometry centering or explicit y
            PIECE_Y_OFFSET(piece.type),
            (rowIndex * SQUARE_SIZE) - offset
        )
        scene.add(pieceMesh)
        pieceMeshes.push(pieceMesh)
        
        // Store metadata
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
    // 2 (board height) / 2 = 1 (surface level)
    // + half height of piece
    switch(type) {
        case 'p': return 1 + 2; 
        case 'r': return 1 + 3;
        case 'n': return 1 + 3;
        case 'b': return 1 + 4;
        case 'q': return 1 + 4.5;
        case 'k': return 1 + 5;
        default: return 3;
    }
}

function createPieceMesh(piece: { type: string, color: string }) {
    // ... (logic from before, copied here for clarity if I was replacing whole function, but I am patching. 
    // I will assume I replaced the full `updatePieces` and `createPieceMesh` block in previous step.
    // Wait, the previous replacement ended at `animate`.
    // I should rewrite `createPieceMesh` to be cleaner or just assume it exists.)
    // For this tool call, I will rewrite `createPieceMesh` to be safe.
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

    // If it's my turn and my piece
    if (data.color === store.turn) {
        selectedSquare.value = { x: data.x, z: data.z }
        // Highlight valid moves
        // Convert x,z to Algebra (0,0 -> a8)
        // chess.js: a8 is 0,0 ? No.
        // chess.js board() is:
        // [
        //   [ {square: 'a8', type: 'r', ...}, {square: 'b8', ...} ], // Rank 8 (Index 0)
        //   ...
        // ]
        // So row 0 is Rank 8. Col 0 is File a.
        // x = Col, z = Row.
        const squareName = toSquare(data.x, data.z)
        const moves = store.getValidMoves(squareName as any)
        highlightValidMoves(moves.map(m => m.to))
    } else {
        // Clicked opponent piece -> Capture? 
        // Only if we already have a selected piece
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

    const success = store.makeMove({ from, to, promotion: 'q' }) // Always promote to Queen for now
    if (success) {
        selectedSquare.value = null
        highlightValidMoves([])
        // Animation is handled by watch(fen) -> updatePieces currently.
        // Later we can interpret lastMove to do smooth anim.
    } else {
        // Invalid move
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
    // Remove old highlights (which we can store or just query)
    // Ideally we have a group for highlights.
    // For simplicity: We will rely on re-rendering or overlay meshes.
    // Let's create a simple highlight group
    const highlightGroup = scene.getObjectByName('highlights')
    if (highlightGroup) scene.remove(highlightGroup)

    if (squares.length === 0) return

    const group = new THREE.Group()
    group.name = 'highlights'
    
    // Geometry for highlight (flat square on ground)
    const geometry = new THREE.PlaneGeometry(SQUARE_SIZE * 0.9, SQUARE_SIZE * 0.9)
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    geometry.rotateX(-Math.PI / 2)

    const offset = (BOARD_SIZE / 2) - (SQUARE_SIZE / 2)
    
    // Map squares 'e4' to x,z
    squares.forEach(sq => {
        // 'e4' -> file 'e' index 4, rank '4' index ...
        const file = sq.charCodeAt(0) - 97 // 'a' is 97 -> 0
        const rank = parseInt(sq[1]) 
        // Rank 8 is index 0. Rank 1 is index 7.
        // Index = 8 - Rank.
        const z = 8 - rank
        const x = file
        
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(
            (x * SQUARE_SIZE) - offset,
            1.1, // Slightly above board
            (z * SQUARE_SIZE) - offset
        )
        group.add(mesh)
    })
    
    scene.add(group)
}

// Watch for store changes to re-render
watch(() => store.fen, () => {
    updatePieces()
})

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

onMounted(() => {
  initThree()
  window.addEventListener('resize', onWindowResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
  cancelAnimationFrame(animationId)
  if (renderer) renderer.dispose()
})

</script>

<style scoped>
.three-container {
  width: 100%;
  height: 600px; /* Temporary fixed height */
  border: 4px solid #cfa76e; /* Gold border */
  border-radius: 8px;
  overflow: hidden;
}
</style>
