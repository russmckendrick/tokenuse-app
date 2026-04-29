import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://github.com/russmckendrick/tokenuse",
  vite: {
    plugins: [tailwindcss()]
  }
});
