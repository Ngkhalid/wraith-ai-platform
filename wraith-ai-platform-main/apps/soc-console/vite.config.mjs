import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  build: {
    outDir: "dist/client",
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@tabler")) return "icons";
          if (id.includes("node_modules/echarts") || id.includes("node_modules/zrender")) return "charts";
          if (id.includes("node_modules/topojson") || id.includes("node_modules/world-atlas")) return "maps";
          if (id.includes("node_modules/react") || id.includes("node_modules/scheduler")) return "react";
          return undefined;
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "127.0.0.1",
    allowedHosts: ["127.0.0.1", "localhost", "terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react()],
});
