import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'medieval',
    themes: {
      medieval: {
        dark: true,
        colors: {
          background: '#1a1815', // Dark brown/charcoal
          surface: '#2c2520',    // Lighter brown/wood
          primary: '#cfa76e',    // Gold
          secondary: '#8b4513',  // Saddle brown
          accent: '#722f37',     // Wine red
          error: '#b71c1c',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FB8C00',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
})
