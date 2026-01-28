<template lang="pug">
v-app.medieval-font
  v-main
    v-container(fluid fill-height).pa-0.game-container
      v-row(no-gutters justify="center" align="center").fill-height
        v-col(cols="12").text-center
          h1.text-h2.text-primary.mb-4(style="font-family: 'Times New Roman', serif;") Battle Chess
          Board3D
    BattleArena
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Board3D from '~/components/board/Board3D.vue'
import BattleArena from '~/components/battle/BattleArena.vue'
import { useGameStore } from '~/stores/game'

export default defineComponent({
  name: 'IndexPage',
  components: {
    Board3D,
    BattleArena,
  },
  setup() {
    const store = useGameStore()
    return { store }
  }
})
</script>

<style lang="less">
html, body {
  overflow: hidden;
}

.game-container {
  background-color: @background-darker;
  background-image: radial-gradient(circle at center, @background-dark 0%, #000000 100%);
}

.medieval-font {
  font-family: 'Cinzel', 'Times New Roman', serif !important;
}
</style>
