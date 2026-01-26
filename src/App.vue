<script setup lang="ts">
import Board3D from './components/board/Board3D.vue'
</script>

<template>
  <v-app class="medieval-font">
    <v-main>
      <v-container fluid fill-height class="pa-0 fill-height game-container">
         <v-row no-gutters justify="center" align="center" class="fill-height">
            <v-col cols="12" class="text-center">
                 <h1 class="text-h2 text-primary mb-4" style="font-family: 'Times New Roman', serif;">Battle Chess</h1>
                 <Board3D />
            </v-col>
         </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style>
/* Global overrides for that "Medieval" feel */
html, body {
  overflow: hidden; /* Prevent scrolling for the game app feel */
}

.game-container {
  background-color: #12100e; /* Very dark background */
  background-image: radial-gradient(circle at center, #1a1815 0%, #000000 100%);
}

.medieval-font {
  font-family: 'Cinzel', 'Times New Roman', serif !important;
}
</style>
