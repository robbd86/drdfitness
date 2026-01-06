import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@components": path.resolve(__dirname, "src/components"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@hooks": path.resolve(__dirname, "src/hooks"),
      "@lib": path.resolve(__dirname, "src/lib"),
      "@domain": path.resolve(__dirname, "src/domain"),
      "@services": path.resolve(__dirname, "src/services"),
      "@ui": path.resolve(__dirname, "src/components/ui"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,

    // 🔴 THIS IS THE FIX
      allowedHosts: true,

    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },
});


