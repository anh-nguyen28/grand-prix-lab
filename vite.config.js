import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/three/examples/')) return 'three-tools';
          if (id.includes('/node_modules/three/')) return 'three-core';
        },
      },
    },
  },
});
