import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify('1.3.32.47'),
  },
  server: {
    host: "::",
    port: 8080,
    strictPort: false,
    allowedHosts: [
      'app.buinsoft.com',
      'localhost',
      '.buinsoft.com', // Allow all subdomains
    ],
    proxy: {
      '/api': {
        // Backend Docker container'da port 80'de çalışıyor (içeride 3000)
        // Development ve production'da aynı yere git (Docker container)
        target: 'http://localhost:80',
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true, // Enable source maps for better debugging
    chunkSizeWarningLimit: 1000, // Increase warning limit
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
          'flow-editor': ['@xyflow/react', '@xyflow/system'],
          'editor': ['@tiptap/react', '@tiptap/starter-kit'],
        },
      },
    },
  },
}));
