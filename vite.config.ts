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
        // Separar apenas o Firebase (grande e sem dependência do React) num chunk
        // próprio, para melhorar o cache entre deploys. NÃO separar React/UI: dividir
        // o React das libs que o usam causa erro de ordem de init no build (forwardRef).
        manualChunks(id) {
          if (id.includes('node_modules') && (id.includes('firebase') || id.includes('@firebase'))) {
            return 'firebase';
          }
        },
      }
    }
  }
}));

