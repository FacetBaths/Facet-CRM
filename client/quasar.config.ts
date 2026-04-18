import { defineConfig } from '#q-app/wrappers';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig((ctx) => {
  return {
    boot: ['axios', 'socket'],

    css: ['app.scss'],

    extras: [
      'roboto-font',
      'material-icons',
    ],

    build: {
      target: {
        browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
        node: 'node20',
      },
      typescript: {
        strict: true,
        vueShim: true,
      },
      vueRouterMode: 'history',
      publicPath: '/',
      extendViteConf(viteConf, { isClient, isServer }) {
        viteConf.resolve = viteConf.resolve || {};
        viteConf.resolve.alias = {
          ...viteConf.resolve.alias,
          '@': fileURLToPath(new URL('./src', import.meta.url)),
        };
      },
    },

    devServer: {
      port: 5173,
      open: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },

    framework: {
      config: {
        brand: {
          primary: '#9945FF',
          secondary: '#14F195',
          accent: '#9C27B0',
          dark: '#1D1D1D',
          'dark-page': '#121212',
          positive: '#21BA45',
          negative: '#C10015',
          info: '#31CCEC',
          warning: '#F2C037',
        },
      },
      plugins: ['Notify', 'Dialog', 'Loading'],
    },

    animations: [],

    ssr: {
      pwa: false,
      prodPort: 3000,
      middlewares: ['render'],
    },

    pwa: {
      workboxMode: 'generateSW',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false,
    },

    sourceFiles: {
      rootComponent: 'src/App.vue',
      router: 'src/router/index.ts',
      store: 'src/stores/index.ts',
    },
  };
});
