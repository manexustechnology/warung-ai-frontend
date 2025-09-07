import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {},
    'window.ethereum': 'undefined',
  },
  optimizeDeps: {
    include: ['lucide-react'],
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    rollupOptions: {
      external: [],
    },
  },
  // Prevent any MetaMask or Ethereum-related injections
  resolve: {
    alias: {
      // Ensure no ethereum-related modules are loaded
      'web3': false,
      'ethers': false,
      '@metamask/detect-provider': false,
    },
  },
});