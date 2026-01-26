import { defineStore } from 'pinia'
import { Chess, type Move, type Square } from 'chess.js'
import { ref, computed } from 'vue'

export const useGameStore = defineStore('game', () => {
  // The Chess.js engine instance
  const chess = new Chess()

  // Reactive state
  const fen = ref(chess.fen())
  const turn = ref(chess.turn()) // 'w' or 'b'
  const isGameOver = ref(false)
  const isCheck = ref(false)
  const isCheckmate = ref(false)
  const isDraw = ref(false)
  const history = ref<string[]>([])
  const lastMove = ref<Move | null>(null)

  // Actions
  function updateGameState() {
    fen.value = chess.fen()
    turn.value = chess.turn()
    isGameOver.value = chess.isGameOver()
    isCheck.value = chess.isCheck()
    isCheckmate.value = chess.isCheckmate()
    isDraw.value = chess.isDraw()
    history.value = chess.history()
  }

  function resetGame() {
    chess.reset()
    lastMove.value = null
    updateGameState()
  }

  /**
   * Attempts to make a move.
   * @param move - object { from: 'e2', to: 'e4', promotion: 'q' }
   * @returns boolean - true if valid and made, false otherwise
   */
  function makeMove(move: { from: string; to: string; promotion?: string }) {
    try {
      const result = chess.move(move)
      if (result) {
        lastMove.value = result
        updateGameState()
        return true
      }
    } catch (e) {
      // Invalid move
      return false
    }
    return false
  }

  function getValidMoves(square: Square) {
    return chess.moves({ square, verbose: true })
  }

  // Getters
  const board = computed(() => chess.board())

  return {
    fen,
    turn,
    isGameOver,
    isCheck,
    isCheckmate,
    isDraw,
    history,
    lastMove,
    board,
    resetGame,
    makeMove,
    getValidMoves
  }
})
