import astroServer from "@astrojs/cloudflare/entrypoints/server";
import {
  CONTENT_SIGNAL,
  HOMEPAGE_AGENT_LINKS,
  appendVary,
  estimateMarkdownTokens,
  formatLinkHeader,
} from "./lib/agent-discovery";

interface AssetFetcher {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}

interface Env {
  ASSETS: AssetFetcher;
}

interface ExecutionContextLike {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException?(): void;
}

const MARKDOWN_ACCEPT = "text/markdown";
const CANONICAL_ORIGIN = "https://tokenuse.app";
const CANONICAL_HOST = "tokenuse.app";
const WWW_HOST = "www.tokenuse.app";
const PERMANENT_REDIRECT_STATUS = 308;
const ASTRO_INTERNAL_PATHS = new Set(["/__astro_static_paths", "/__astro_prerender", "/__astro_static_images"]);
const LEGACY_DOC_REDIRECTS = new Map([
  ["/docs/quick-start/", "/docs/guides/installation/"],
  ["/docs/architecture/", "/docs/development/architecture/"],
  ["/docs/usage/", "/docs/guides/tui-usage/#usage-page"],
  ["/docs/desktop/", "/docs/guides/desktop-usage/"],
  ["/docs/tools/", "/docs/development/tools/"],
]);

const astro = astroServer as {
  fetch(request: Request, env: Env, context: ExecutionContextLike): Promise<Response>;
};

export default {
  async fetch(request: Request, env: Env, context: ExecutionContextLike): Promise<Response> {
    const url = new URL(request.url);
    const canonicalRedirect = redirectToCanonicalOrigin(url);
    if (canonicalRedirect) return canonicalRedirect;

    const legacyRedirect = redirectLegacyDocsPath(url);
    if (legacyRedirect) return legacyRedirect;

    if (ASTRO_INTERNAL_PATHS.has(url.pathname)) {
      return astro.fetch(request, env, context);
    }

    if (canNegotiateMarkdown(request) && wantsMarkdown(request)) {
      const markdown = await serveMarkdownTwin(request, env, url);
      if (markdown) return markdown;
    }

    const response = await astro.fetch(request, env, context);
    return withAgentHeaders(response, url);
  },
};

function canNegotiateMarkdown(request: Request): boolean {
  return request.method === "GET" || request.method === "HEAD";
}

function wantsMarkdown(request: Request): boolean {
  return request.headers.get("Accept")?.toLowerCase().includes(MARKDOWN_ACCEPT) ?? false;
}

function markdownCandidates(pathname: string): string[] {
  if (pathname === "/" || pathname === "") return ["/index.md"];

  const withoutTrailingSlash = pathname.replace(/\/$/, "");
  const candidates = [`${withoutTrailingSlash}.md`];

  if (pathname.endsWith("/")) {
    candidates.push(`${pathname}index.md`);
  }

  return [...new Set(candidates)];
}

async function serveMarkdownTwin(request: Request, env: Env, url: URL): Promise<Response | null> {
  for (const pathname of markdownCandidates(url.pathname)) {
    const markdownUrl = new URL(url);
    markdownUrl.pathname = pathname;
    markdownUrl.search = "";

    const markdownRequest = new Request(markdownUrl, request);
    const response = await env.ASSETS.fetch(markdownRequest);
    if (!response.ok) continue;

    const markdown = await response.text();
    const headers = agentHeaders(response.headers, url);
    headers.set("Content-Type", "text/markdown; charset=utf-8");
    headers.set("Vary", appendVary(headers.get("Vary"), "Accept"));
    headers.set("x-markdown-tokens", String(estimateMarkdownTokens(markdown)));
    if (isMarkdownTwinPath(pathname)) {
      headers.set("X-Robots-Tag", "noindex, follow");
    }

    return new Response(request.method === "HEAD" ? null : markdown, {
      status: 200,
      statusText: "OK",
      headers,
    });
  }

  return null;
}

function withAgentHeaders(response: Response, url: URL): Response {
  const headers = agentHeaders(response.headers, url);

  if (url.pathname.endsWith(".md")) {
    headers.set("Content-Type", "text/markdown; charset=utf-8");
  }

  if (isMarkdownTwinPath(url.pathname)) {
    headers.set("X-Robots-Tag", "noindex, follow");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function agentHeaders(source: Headers, url: URL): Headers {
  const headers = new Headers(source);
  headers.set("Content-Signal", CONTENT_SIGNAL);

  if (isHomepage(url.pathname)) {
    for (const link of HOMEPAGE_AGENT_LINKS) {
      headers.append("Link", formatLinkHeader(link));
    }
  }

  return headers;
}

function isHomepage(pathname: string): boolean {
  return pathname === "/" || pathname === "/index.html" || pathname === "/index.md";
}

function redirectToCanonicalOrigin(url: URL): Response | null {
  if (!isCanonicalHostFamily(url.hostname)) return null;
  if (url.protocol === "https:" && url.hostname === CANONICAL_HOST) return null;

  const destination = new URL(url.href);
  destination.protocol = "https:";
  destination.hostname = CANONICAL_HOST;
  destination.port = "";
  return redirectResponse(destination);
}

function redirectLegacyDocsPath(url: URL): Response | null {
  const destinationPath = legacyDocsDestinationPath(url.pathname);
  if (!destinationPath) return null;

  const destination = new URL(destinationPath, CANONICAL_ORIGIN);
  destination.search = url.search;
  if (!destination.hash) {
    destination.hash = url.hash;
  }
  return redirectResponse(destination);
}

function legacyDocsDestinationPath(pathname: string): string | undefined {
  const directDestination = LEGACY_DOC_REDIRECTS.get(pathname);
  if (directDestination) return directDestination;

  const toolSlug = pathname.match(/^\/docs\/tools\/([^/]+)\/$/)?.[1];
  if (!toolSlug) return undefined;

  return `/docs/development/tools/${toolSlug}/`;
}

function isCanonicalHostFamily(hostname: string): boolean {
  return hostname === CANONICAL_HOST || hostname === WWW_HOST;
}

function redirectResponse(destination: URL): Response {
  return new Response(null, {
    status: PERMANENT_REDIRECT_STATUS,
    headers: {
      Location: destination.href,
    },
  });
}

function isMarkdownTwinPath(pathname: string): boolean {
  if (pathname === "/index.md") return true;
  if (!pathname.endsWith(".md")) return false;

  return pathname.startsWith("/docs/") || pathname.startsWith("/releases/");
}
