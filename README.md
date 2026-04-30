# Tokenuse App

Website and documentation app for [tokenuse](https://github.com/russmckendrick/tokenuse), deployed to [tokenuse.app](https://tokenuse.app).

## Development

```sh
pnpm install
pnpm run dev
```

The site syncs documentation from a local `tokenuse` checkout before running Astro. By default it looks for that checkout at `../tokens`; set `TOKENUSE_SOURCE_DIR` to use a different path.

## Checks

```sh
pnpm run check
pnpm run build
```

## Deployment

Cloudflare Workers deployment is handled by GitHub Actions and Wrangler. Production deploys run from `main`, manual workflow dispatches, and release dispatches from the main `tokenuse` repo.
