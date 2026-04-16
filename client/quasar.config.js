import { defineConfig } from '#q-app/wrappers'

export default defineConfig((ctx) => ({
  boot: [
    'axios',
    'socket'
  ],
  css: [
    'app.scss'
  ],
  extras: [
    'material-icons'
  ],
  framework: {
    plugins: [
      'Notify',
      'Dialog',
      'Loading'
    ]
  },
  build: {
    vueRouterMode: 'history'
  },
  devServer: {
    port: 5173,
    open: false
  },
  animations: [],
  sourceFiles: {
    router: 'src/router/index.ts',
    store: 'src/stores/index.ts'
  }
}))