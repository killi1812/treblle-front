/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

// Styles
import '@/styles/style.css'
import '@/styles/dark-theme.css'

const app = createApp(App)

registerPlugins(app)

app.mount('#app')
