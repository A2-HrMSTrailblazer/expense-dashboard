import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base: './' makes every asset path relative, so the built site works on
// GitHub Pages under https://<user>.github.io/<repo>/ without editing this file.
export default defineConfig({
  plugins: [vue()],
  base: './',
})
