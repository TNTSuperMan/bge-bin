import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  server: {
    fs: {
      allow: [".", "../../tmp", "../../../bge-wasm/pkg"]
    },
    port: 4000
  }
})
