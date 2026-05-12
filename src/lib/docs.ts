import { getCollection, getEntry, type CollectionEntry } from "astro:content";

export type DocsEntry = CollectionEntry<"tokenuseDocs">;

export interface DocsPageMeta {
  id: string;
  entryId: string;
  href: string;
  title: string;
  navLabel: string;
  eyebrow: string;
  description: string;
  level?: number;
  group?: string;
  order?: number;
}

export interface DocsNavGroup {
  label: string;
  items: DocsPageMeta[];
}

type DocsPageOverride = Partial<
  Pick<DocsPageMeta, "title" | "navLabel" | "eyebrow" | "description" | "level" | "group" | "order">
>;

const DOC_META: Record<string, DocsPageOverride> = {
  overview: {
    title: "Documentation",
    navLabel: "Overview",
    eyebrow: "Start here",
    group: "Guides",
    order: 0,
    description: "The working manual for tokenuse: install it, use it, develop it, and follow project releases.",
  },
  "guides/installation": {
    navLabel: "Installation",
    eyebrow: "Guides",
    group: "Guides",
    order: 10,
    description: "Install the TUI and desktop app from Homebrew or GitHub Releases.",
  },
  "guides/tui-usage": {
    navLabel: "TUI usage",
    eyebrow: "Guides",
    group: "Guides",
    order: 20,
    description: "Navigate the dashboard, filters, keyboard shortcuts, config, session drill-down, reports, and Usage.",
  },
  "guides/desktop-usage": {
    navLabel: "Desktop app usage",
    eyebrow: "Guides",
    group: "Guides",
    order: 30,
    description: "Use the Tauri desktop app for local refresh, filtering, config, Insights, reports, and export.",
  },
  "guides/insights": {
    navLabel: "Insights",
    eyebrow: "Guides",
    group: "Guides",
    order: 40,
    description: "Use local Signals and optional manual advice to spot model, cache, anomaly, and quota patterns.",
  },
  development: {
    navLabel: "Overview",
    eyebrow: "Development",
    group: "Development",
    order: 100,
    description: "Source layout and the maintainer docs to read before changing tokenuse.",
  },
  "development/architecture": {
    navLabel: "Architecture",
    eyebrow: "Development",
    group: "Development",
    order: 110,
    description: "Follow the local archive, ingestion, aggregation, pricing, export, and frontend data flow.",
  },
  "development/pricing": {
    navLabel: "Pricing",
    eyebrow: "Development",
    group: "Development",
    order: 120,
    description: "Official-source pricing, cache-rate multipliers, parser caveats, and local pricing book refreshes.",
  },
  "development/local-development": {
    navLabel: "Local development",
    eyebrow: "Development",
    group: "Development",
    order: 130,
    description: "Run the TUI, desktop app, checks, generated data refreshes, and no-download builds locally.",
  },
  "development/source-control": {
    navLabel: "Source control",
    eyebrow: "Development",
    group: "Development",
    order: 140,
    description: "Branch hygiene, generated files, docs boundaries, version bumps, and release-prep notes.",
  },
  "development/deployments": {
    navLabel: "Deployments",
    eyebrow: "Development",
    group: "Development",
    order: 150,
    description: "Release workflows, binary assets, desktop notarization, and Homebrew tap automation.",
  },
  "development/tools": {
    title: "Tool Ingestion",
    navLabel: "Tool parsers",
    eyebrow: "Development",
    group: "Development",
    order: 160,
    description: "How tokenuse discovers, validates, parses, deduplicates, and prices local AI tool records.",
  },
  "development/tools/claude-code": {
    navLabel: "Claude Code",
    eyebrow: "Tool parser",
    group: "Development",
    level: 1,
    order: 200,
    description: "Claude Code session paths, JSONL record shape, token mapping, and tool extraction.",
  },
  "development/tools/codex": {
    navLabel: "Codex",
    eyebrow: "Tool parser",
    group: "Development",
    level: 1,
    order: 210,
    description: "Codex rollout validation, token-count deltas, rate-limit snapshots, and project detection.",
  },
  "development/tools/cursor": {
    navLabel: "Cursor",
    eyebrow: "Tool parser",
    group: "Development",
    level: 1,
    order: 220,
    description: "Cursor SQLite discovery, bubble and Agent KV parsing, estimation, and known limitations.",
  },
  "development/tools/copilot": {
    navLabel: "GitHub Copilot",
    eyebrow: "Tool parser",
    group: "Development",
    level: 1,
    order: 230,
    description: "Copilot CLI and VS Code transcript ingestion, model inference, and tool normalization.",
  },
  "development/tools/gemini": {
    navLabel: "Gemini",
    eyebrow: "Tool parser",
    group: "Development",
    level: 1,
    order: 240,
    description: "Gemini CLI session discovery, JSON/JSONL chat parsing, token and thought tracking.",
  },
  "development/tools/claude-subscription": {
    navLabel: "Claude.ai subscription",
    eyebrow: "Limits adapter",
    group: "Development",
    level: 1,
    order: 250,
    description: "Opt-in Claude.ai quota gauges stored in the OS keychain and shown with Claude Code usage.",
  },
  "development/tools/codex-subscription": {
    navLabel: "ChatGPT (Codex) subscription",
    eyebrow: "Limits adapter",
    group: "Development",
    level: 1,
    order: 260,
    description: "Opt-in ChatGPT quota gauges stored in the OS keychain and shown with local Codex usage.",
  },
};

const GROUP_ORDER: Record<string, number> = {
  Guides: 0,
  Development: 1,
};

function normalizeEntryId(entryId: string): string {
  return entryId.replace(/^README$/i, "readme").replace(/\/README$/gi, "/readme");
}

function idForEntryId(entryId: string): string {
  const normalized = normalizeEntryId(entryId);
  if (normalized === "readme") return "overview";
  if (normalized.endsWith("/readme")) return normalized.slice(0, -"/readme".length);
  return normalized;
}

function hrefForEntryId(entryId: string): string {
  const normalized = normalizeEntryId(entryId);
  if (normalized === "readme") return "/docs/";
  if (normalized.endsWith("/readme")) return `/docs/${normalized.slice(0, -"/readme".length)}/`;
  return `/docs/${normalized}/`;
}

function toTitleCase(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .replace(/\bTui\b/g, "TUI")
    .replace(/\bApi\b/g, "API")
    .replace(/\bCli\b/g, "CLI");
}

function fallbackTitle(id: string): string {
  if (id === "overview") return "Documentation";
  return toTitleCase(id.split("/").at(-1) ?? id);
}

function cleanMarkdown(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(body: string | undefined, fallback: string): string {
  const match = body?.match(/^#\s+(.+)$/m);
  return match ? cleanMarkdown(match[1]) : fallback;
}

function extractDescription(body: string | undefined, fallback: string): string {
  if (!body) return fallback;

  let inFence = false;
  const paragraph: string[] = [];

  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (!trimmed) {
      if (paragraph.length > 0) break;
      continue;
    }
    if (/^(#|>|[-*]\s|\d+\.\s|\|)/.test(trimmed)) continue;

    paragraph.push(trimmed);
  }

  const cleaned = cleanMarkdown(paragraph.join(" "));
  if (!cleaned) return fallback;
  return cleaned.length > 220 ? `${cleaned.slice(0, 217).trim()}...` : cleaned;
}

function inferredGroup(id: string): string {
  if (id === "overview") return "Guides";
  return toTitleCase(id.split("/")[0] ?? "Docs");
}

function inferredEyebrow(id: string, group: string): string {
  if (id === "overview") return "Start here";
  if (id.startsWith("development/tools/")) return "Tool parser";
  return group;
}

function defaultOrder(page: DocsPageMeta): number {
  if (page.order !== undefined) return page.order;
  if (page.id.startsWith("development/tools/")) return 500;
  return 400;
}

function sortPages(a: DocsPageMeta, b: DocsPageMeta): number {
  const groupA = GROUP_ORDER[a.group ?? ""] ?? 99;
  const groupB = GROUP_ORDER[b.group ?? ""] ?? 99;
  if (groupA !== groupB) return groupA - groupB;

  const orderA = defaultOrder(a);
  const orderB = defaultOrder(b);
  if (orderA !== orderB) return orderA - orderB;

  return a.title.localeCompare(b.title);
}

function pageFromEntry(entry: DocsEntry): DocsPageMeta {
  const id = idForEntryId(entry.id);
  const override = DOC_META[id] ?? {};
  const group = override.group ?? inferredGroup(id);
  const title = override.title ?? extractTitle(entry.body, fallbackTitle(id));
  const description = override.description ?? extractDescription(entry.body, `${title} documentation for Token Use.`);

  return {
    id,
    entryId: entry.id,
    href: hrefForEntryId(entry.id),
    title,
    navLabel: override.navLabel ?? title,
    eyebrow: override.eyebrow ?? inferredEyebrow(id, group),
    description,
    level: override.level ?? (id.startsWith("development/tools/") ? 1 : undefined),
    group,
    order: override.order,
  };
}

export async function getAllDocsPages(): Promise<DocsPageMeta[]> {
  const entries = await getCollection("tokenuseDocs");
  return entries.map(pageFromEntry).sort(sortPages);
}

export async function getToolDocsPages(): Promise<DocsPageMeta[]> {
  return (await getAllDocsPages()).filter((page) => page.id.startsWith("development/tools/") && page.id !== "development/tools");
}

export async function getDocsNavGroups(): Promise<DocsNavGroup[]> {
  const pages = await getAllDocsPages();
  const groups = new Map<string, DocsPageMeta[]>();
  for (const page of pages) {
    const group = page.group ?? inferredGroup(page.id);
    groups.set(group, [...(groups.get(group) ?? []), page]);
  }

  const navGroups = [...groups]
    .sort(([a], [b]) => (GROUP_ORDER[a] ?? 99) - (GROUP_ORDER[b] ?? 99) || a.localeCompare(b))
    .map(([label, items]) => ({ label, items }));

  return [
    ...navGroups,
    {
      label: "Project",
      items: [
        {
          id: "releases",
          entryId: "",
          href: "/releases/",
          title: "Releases",
          navLabel: "Releases",
          eyebrow: "GitHub",
          description: "Release notes are fetched from GitHub releases at build time.",
        },
      ],
    },
  ];
}

export const overviewCardIds = [
  "guides/installation",
  "guides/tui-usage",
  "guides/desktop-usage",
  "guides/insights",
  "development",
  "development/tools",
] as const;

export async function getDocsPageById(id: string): Promise<DocsPageMeta> {
  const page = (await getAllDocsPages()).find((item) => item.id === id);
  if (!page) throw new Error(`Unknown docs page id: ${id}`);
  return page;
}

export async function getDocsPageBySlug(slug: string | undefined): Promise<DocsPageMeta | undefined> {
  const href = slug ? `/docs/${slug.replace(/\/?$/, "/")}` : "/docs/";
  return (await getAllDocsPages()).find((page) => page.href === href);
}

export function slugForDocsPage(page: DocsPageMeta): string | undefined {
  if (page.href === "/docs/") return undefined;
  return page.href.replace(/^\/docs\//, "").replace(/\/$/, "");
}

export async function getDocsEntry(page: DocsPageMeta): Promise<DocsEntry> {
  const entry = await getEntry("tokenuseDocs", page.entryId);
  if (!entry) {
    throw new Error(
      `Missing generated docs entry "${page.entryId}". Run pnpm run sync:docs and confirm TOKENUSE_SOURCE_DIR points at tokenuse.`
    );
  }

  return entry;
}
