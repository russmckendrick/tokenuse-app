import { defineConfig, sessionDrivers } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import { satteri } from "@astrojs/markdown-satteri";
import mermaid from "astro-mermaid";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://tokenuse.app",
  // "server" output so the adapter builds src/worker.ts (see wrangler.jsonc
  // `main`); every page opts back into prerendering, so the deployed Worker
  // serves static assets plus the custom redirect/markdown-twin logic.
  output: "server",
  adapter: cloudflare({ imageService: "compile" }),
  // Sessions are unused; an explicit non-KV driver stops the adapter from
  // injecting a SESSION KV binding into the deploy config.
  session: { driver: sessionDrivers.memory() },
  integrations: [
    mermaid({
      theme: "base",
      autoTheme: false,
      enableLog: false,
      mermaidConfig: {
        securityLevel: "strict",
        themeVariables: {
          background: "#1c1612",
          primaryColor: "#2a1f17",
          primaryTextColor: "#f4ead6",
          primaryBorderColor: "#d4a574",
          lineColor: "#d4a574",
          secondaryColor: "#34261c",
          tertiaryColor: "#221a14",
          noteBkgColor: "#34261c",
          noteTextColor: "#f4ead6",
          fontFamily: "JetBrains Mono, ui-monospace, monospace"
        }
      }
    })
  ],
  markdown: {
    // An explicit Sätteri processor is required for astro-mermaid to register
    // its mdast plugin; without it the integration falls back to the
    // deprecated markdown.remarkPlugins/rehypePlugins arrays.
    processor: satteri()
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
