import fallbackData from "../data/releases.fallback.json";

export interface Release {
  tag: string;
  version: string;
  name: string;
  bodyHtml: string;
  bodyMarkdown: string;
  publishedAt: string;
  url: string;
  prerelease: boolean;
}

interface GitHubRelease {
  tag_name: string;
  name: string | null;
  body: string | null;
  published_at: string | null;
  html_url: string;
  prerelease: boolean;
  draft: boolean;
}

const REPO = "russmckendrick/tokenuse";
const API_URL = `https://api.github.com/repos/${REPO}/releases?per_page=100`;

function stripV(tag: string): string {
  return tag.replace(/^v/i, "");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderInline(value: string): string {
  const codeSpans: string[] = [];
  let marked = value.replace(/`([^`]+)`/g, (_, code: string) => {
    const index = codeSpans.push(`<code>${escapeHtml(code)}</code>`) - 1;
    return `@@CODE${index}@@`;
  });

  marked = escapeHtml(marked)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]+|#[^)]+)\)/g, '<a href="$2">$1</a>');

  return marked.replace(/@@CODE(\d+)@@/g, (_, index: string) => codeSpans[Number(index)] ?? "");
}

function renderBody(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const html: string[] = [];
  let inList = false;
  let inCode = false;
  let codeLines: string[] = [];

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  const closeCode = () => {
    if (inCode) {
      html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      codeLines = [];
      inCode = false;
    }
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) {
        closeCode();
      } else {
        closeList();
        inCode = true;
        codeLines = [];
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      closeList();
      continue;
    }

    const h3 = line.match(/^###\s+(.+)$/);
    const h2 = line.match(/^##\s+(.+)$/);
    const h1 = line.match(/^#\s+(.+)$/);
    const li = line.match(/^-\s+(.+)$/);

    if (h3 || h2 || h1) closeList();
    if (h3) html.push(`<h3>${renderInline(h3[1])}</h3>`);
    else if (h2) html.push(`<h2>${renderInline(h2[1])}</h2>`);
    else if (h1) html.push(`<h1>${renderInline(h1[1])}</h1>`);
    else if (li) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${renderInline(li[1])}</li>`);
    } else {
      closeList();
      html.push(`<p>${renderInline(line)}</p>`);
    }
  }

  closeList();
  closeCode();

  return html.join("\n");
}

function normalise(raw: GitHubRelease): Release {
  const body = raw.body ?? "";

  return {
    tag: raw.tag_name,
    version: stripV(raw.tag_name),
    name: raw.name?.trim() || raw.tag_name,
    bodyMarkdown: body,
    bodyHtml: renderBody(body),
    publishedAt: raw.published_at ?? "",
    url: raw.html_url,
    prerelease: raw.prerelease,
  };
}

let cache: Promise<Release[]> | null = null;

async function fetchFromGitHub(): Promise<Release[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "tokenuse-site-docs",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const token = import.meta.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(API_URL, { headers });
  if (!res.ok) {
    throw new Error(`GitHub releases fetch failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as GitHubRelease[];
  return data.filter((release) => !release.draft).map(normalise);
}

function loadFallback(): Release[] {
  return (fallbackData as GitHubRelease[])
    .filter((release) => !release.draft)
    .map(normalise);
}

export async function getReleases(): Promise<Release[]> {
  if (!cache) {
    cache = fetchFromGitHub()
      .then((releases) => {
        if (releases.length > 0) return releases;

        console.warn("[releases] no GitHub releases found - falling back to src/data/releases.fallback.json");
        return loadFallback();
      })
      .catch((err: Error) => {
        console.warn(`[releases] ${err.message} - falling back to src/data/releases.fallback.json`);
        return loadFallback();
      });
  }

  return cache;
}

export async function getLatestRelease(): Promise<Release | null> {
  const releases = await getReleases();
  return releases.find((release) => !release.prerelease) ?? releases[0] ?? null;
}
