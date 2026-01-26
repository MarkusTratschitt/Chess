import { defineStore } from 'pinia'
import { Chess, type Move, type Square } from 'chess.js'

export const useGameStore = defineStore('game', {
  state: () => ({
    chess: new Chess(),
    fen: new Chess().fen(),
    turn: 'w' as 'w' | 'b',
    isGameOver: false,
    isCheck: false,
    isCheckmate: false,
    isDraw: false,
    history: [] as string[],
    lastMove: null as Move | null,
  }),

  getters: {
    board: (state) => state.chess.board(),
  },

  actions: {
    updateGameState() {
      this.fen = this.chess.fen()
      this.turn = this.chess.turn()
      this.isGameOver = this.chess.isGameOver()
      this.isCheck = this.chess.isCheck()
      this.isCheckmate = this.chess.isCheckmate()
      this.isDraw = this.chess.isDraw()
      this.history = this.chess.history()
    },

    resetGame() {
      this.chess.reset()
      this.lastMove = null
      this.updateGameState()
    },

    makeMove(move: { from: string; to: string; promotion?: string }) {
      try {
        const result = this.chess.move(move)
        if (result) {
          this.lastMove = result
          this.updateGameState()
          return true
        }
      } catch (e) {
        return false
      }
      return false
    },

    getValidMoves(square: Square) {
      return this.chess.moves({ square, verbose: true })
    },
  },
})
