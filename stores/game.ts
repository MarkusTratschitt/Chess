import { defineStore } from 'pinia'
import { Chess, type Move, type Square } from 'chess.js'

export interface BattleState {
  isActive: boolean
  attacker: { type: string; color: string; from: string } | null
  defender: { type: string; color: string; at: string } | null
  move: Move | null
}

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

    // Battle system
    battle: {
      isActive: false,
      attacker: null,
      defender: null,
      move: null,
    } as BattleState,
    battleQueue: [] as BattleState[],
  }),

  getters: {
    board: (state) => state.chess.board(),
    isBattleActive: (state) => state.battle.isActive,
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
      this.battle = {
        isActive: false,
        attacker: null,
        defender: null,
        move: null,
      }
      this.battleQueue = []
      this.updateGameState()
    },

    makeMove(move: { from: string; to: string; promotion?: string }) {
      console.log('[makeMove] Attempting move:', move)
      try {
        // Check if this is a capture move
        const piece = this.chess.get(move.from as Square)
        const targetPiece = this.chess.get(move.to as Square)
        const isCapture = targetPiece !== null

        console.log('[makeMove] Piece:', piece, 'Target:', targetPiece, 'IsCapture:', isCapture)

        const result = this.chess.move(move)
        console.log('[makeMove] Move result:', result)

        if (result) {
          this.lastMove = result

          // Trigger battle if it's a capture
          if (isCapture && piece && targetPiece) {
            console.log('[makeMove] Triggering battle')
            this.triggerBattle({
              attacker: { type: piece.type, color: piece.color, from: move.from },
              defender: { type: targetPiece.type, color: targetPiece.color, at: move.to },
              move: result,
            })
          } else {
            // No battle, just update state
            console.log('[makeMove] No battle, updating state')
            this.updateGameState()
          }

          return true
        }
      } catch (e) {
        console.error('[makeMove] Error:', e)
        return false
      }
      console.log('[makeMove] Move failed')
      return false
    },

    triggerBattle(battleData: {
      attacker: { type: string; color: string; from: string }
      defender: { type: string; color: string; at: string }
      move: Move
    }) {
      // If a battle is already active, queue this one
      if (this.battle.isActive) {
        this.battleQueue.push({
          isActive: false,
          attacker: battleData.attacker,
          defender: battleData.defender,
          move: battleData.move,
        })
      } else {
        // Start the battle
        this.battle = {
          isActive: true,
          attacker: battleData.attacker,
          defender: battleData.defender,
          move: battleData.move,
        }
      }
    },

    completeBattle() {
      // Battle finished, update game state
      this.updateGameState()

      // Check if there are queued battles
      if (this.battleQueue.length > 0) {
        const nextBattle = this.battleQueue.shift()!
        this.battle = {
          ...nextBattle,
          isActive: true,
        }
      } else {
        // No more battles
        this.battle = {
          isActive: false,
          attacker: null,
          defender: null,
          move: null,
        }
      }
    },

    getValidMoves(square: Square) {
      return this.chess.moves({ square, verbose: true })
    },
  },
})
