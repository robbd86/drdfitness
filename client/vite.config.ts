import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const resolvePort = () => {
  const envPort = process.env.PORT ?? process.env.CLIENT_PORT ?? process.env.REPL_PORT;
  const port = envPort ? Number(envPort) : 5000;
  return Number.isInteger(port) && port > 0 ? port : 5000;
};

const CLIENT_PORT = resolvePort();

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
      "@shared": path.resolve(__dirname, "../shared"),
      "@assets": path.resolve(__dirname, "../attached_assets"),
    },
  },

  server: {
    host: "0.0.0.0",
    port: CLIENT_PORT,
    strictPort: true,

    allowedHosts: true,

    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },
});
