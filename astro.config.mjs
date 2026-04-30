import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { rehypeMermaidBlocks } from "./src/lib/rehype-mermaid-blocks.mjs";

export default defineConfig({
  site: "https://github.com/russmckendrick/tokenuse",
  markdown: {
    rehypePlugins: [rehypeMermaidBlocks]
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
