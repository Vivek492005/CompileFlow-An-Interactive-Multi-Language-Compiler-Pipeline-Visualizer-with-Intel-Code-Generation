import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/CompileFlow-An-Interactive-Multi-Language-Compiler-Pipeline-Visualizer-with-Intel-Code-Generation/',
})
