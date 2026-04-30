import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

const tokenuseDocs = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: ".generated/tokenuse-docs",
  }),
});

export const collections = {
  tokenuseDocs,
};
