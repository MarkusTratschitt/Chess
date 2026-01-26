import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: 'medieval',
      themes: {
        medieval: {
          dark: true,
          colors: {
            background: '#1a1815',
            surface: '#2c2520',
            primary: '#cfa76e',
            secondary: '#8b4513',
            accent: '#722f37',
            error: '#b71c1c',
            info: '#2196F3',
            success: '#4CAF50',
            warning: '#FB8C00',
          },
        },
      },
    },
  })

  nuxtApp.vueApp.use(vuetify)
})
