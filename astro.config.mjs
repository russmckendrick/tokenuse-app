import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { rehypeMermaidBlocks } from "./src/lib/rehype-mermaid-blocks.mjs";

export default defineConfig({
  site: "https://tokenuse.app",
  output: "static",
  adapter: cloudflare(),
  integrations: [],
  markdown: {
    rehypePlugins: [rehypeMermaidBlocks]
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
