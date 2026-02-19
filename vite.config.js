import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  root: "./src",
  publicDir: "../public",
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: "server.js", dest: "." },
        { src: "server/*", dest: "server" },
      ],
    }),
  ],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});
