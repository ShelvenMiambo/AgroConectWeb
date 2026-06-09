import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/api-paysuite': {
          target: 'https://paysuite.tech/api/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-paysuite/, ''),
          headers: {
            'Authorization': `Bearer ${env.VITE_PAYSUITE_API_KEY || '2071|IJ66V2mfOhXnjYxS3mTP9kWjPMWKxgL1zOORuOgu5e3d2023'}`
          }
        }
      }
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
      }
    }
  }
  };
});

