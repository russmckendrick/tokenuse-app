#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const sourceRepo = path.resolve(rootDir, process.env.TOKENUSE_SOURCE_DIR ?? "../tokens");
const sourceDocs = path.join(sourceRepo, "docs");
const outputDocs = path.join(rootDir, ".generated", "tokenuse-docs");
const releaseRoute = "/releases/";
const repositoryBlobBase = "https://github.com/russmckendrick/tokenuse/blob/main";

async function assertReadable(dir, label) {
  try {
    await fs.access(dir, fsConstants.R_OK);
  } catch {
    throw new Error(
      `${label} was not found at ${dir}. Checkout russmckendrick/tokenuse and set TOKENUSE_SOURCE_DIR to that checkout before building.`
    );
  }
}

function slash(value) {
  return value.split(path.sep).join("/");
}

function trimExtension(value) {
  return value.replace(/\.md$/i, "");
}

function routeForDoc(relativePath) {
  const normalized = slash(relativePath).replace(/^\.\//, "");
  const withoutExt = trimExtension(normalized);

  if (withoutExt === "README") return "/docs/";
  if (withoutExt === "tools/README") return "/docs/development/tools/";
  if (withoutExt === "releases" || withoutExt.startsWith("releases/")) return releaseRoute;
  if (withoutExt.endsWith("/README")) return `/docs/${withoutExt.slice(0, -"README".length)}`;
  return `/docs/${withoutExt}/`;
}

function splitLinkTarget(target) {
  const hashIndex = target.indexOf("#");
  if (hashIndex === -1) return { pathname: target, hash: "" };
  return { pathname: target.slice(0, hashIndex), hash: target.slice(hashIndex) };
}

function isExternalTarget(target) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(target);
}

function rewriteMarkdownLinks(markdown, fromRelativePath) {
  const fromDir = path.posix.dirname(slash(fromRelativePath));

  return markdown.replace(/(\[[^\]]+\]\()([^)\s]+)(\))/g, (match, prefix, target, suffix) => {
    if (isExternalTarget(target) || target.startsWith("#")) return match;

    const { pathname, hash } = splitLinkTarget(target);
    if (!pathname) return match;

    const normalizedPath = slash(path.posix.normalize(path.posix.join(fromDir, pathname))).replace(/^\.\//, "");
    const normalizedNoSlash = normalizedPath.replace(/\/$/, "");

    if (normalizedPath.startsWith("../")) {
      const repositoryPath = normalizedPath.replace(/^(\.\.\/)+/, "");
      return `${prefix}${repositoryBlobBase}/${repositoryPath}${hash}${suffix}`;
    }

    if (normalizedNoSlash === "releases" || normalizedNoSlash.startsWith("releases/")) {
      return `${prefix}${releaseRoute}${suffix}`;
    }

    if (normalizedNoSlash === "tools") {
      return `${prefix}/docs/development/tools/${hash}${suffix}`;
    }

    if (normalizedPath.endsWith(".md") || normalizedPath.endsWith("/README.md")) {
      return `${prefix}${routeForDoc(normalizedPath)}${hash}${suffix}`;
    }

    return match;
  });
}

async function copyDocs(sourceDir, targetDir, relativeDir = "") {
  const entries = await fs.readdir(path.join(sourceDir, relativeDir), { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === "releases") continue;
    if (entry.name.startsWith(".")) continue;

    const relativePath = path.join(relativeDir, entry.name);
    const sourcePath = path.join(sourceDir, relativePath);
    const targetPath = path.join(targetDir, relativePath);

    if (entry.isDirectory()) {
      await fs.mkdir(targetPath, { recursive: true });
      await copyDocs(sourceDir, targetDir, relativePath);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;

    const source = await fs.readFile(sourcePath, "utf8");
    const rewritten = rewriteMarkdownLinks(source, slash(relativePath));
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, rewritten);
  }
}

function gitOutput(args) {
  try {
    return execFileSync("git", args, {
      cwd: sourceRepo,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

async function writeSourceMetadata() {
  const commit = gitOutput(["rev-parse", "HEAD"]);
  const shortCommit = commit ? gitOutput(["rev-parse", "--short", "HEAD"]) : "";
  const branch = gitOutput(["branch", "--show-current"]);
  const dirty = Boolean(gitOutput(["status", "--short"]));

  await fs.writeFile(
    path.join(outputDocs, "source.json"),
    `${JSON.stringify(
      {
        repository: "russmckendrick/tokenuse",
        sourceDir: sourceRepo,
        docsDir: sourceDocs,
        branch: branch || null,
        commit: commit || null,
        shortCommit: shortCommit || null,
        dirty,
        generatedAt: new Date().toISOString(),
        excluded: ["docs/releases/**"],
      },
      null,
      2
    )}\n`
  );
}

await assertReadable(sourceRepo, "TOKENUSE_SOURCE_DIR");
await assertReadable(sourceDocs, "tokenuse docs directory");
await fs.rm(outputDocs, { recursive: true, force: true });
await fs.mkdir(outputDocs, { recursive: true });
await copyDocs(sourceDocs, outputDocs);
await writeSourceMetadata();

console.log(`[docs] synced ${sourceDocs} -> ${outputDocs} (excluded docs/releases/**)`);
