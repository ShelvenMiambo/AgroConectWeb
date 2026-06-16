import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Preserve image quality: never inline images as base64
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        // Keep assets in organized folders
        assetFileNames: 'assets/[name]-[hash][extname]',
        // Separar bibliotecas grandes em chunks próprios para melhorar o cache
        // entre deploys (o browser só volta a descarregar o que mudou).
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('firebase') || id.includes('@firebase')) return 'firebase';
          if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/')) return 'react-vendor';
          if (id.includes('@radix-ui')) return 'radix';
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';
          return 'vendor';
        },
      }
    }
  }
}));

