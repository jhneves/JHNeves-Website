# JH Neves Website

Static portfolio site with a small Cloudflare Pages deployment workflow.

## Deploy CLI

Use the local `jhweb` helper:

```bash
./jhweb --help
```

Common commands:

```bash
./jhweb site status
./jhweb site status --cloudflare
./jhweb site build
./jhweb site upload
```

One-time Cloudflare setup:

```bash
./jhweb site login
./jhweb site init-cloudflare
```

Deployment config lives in [`.jhweb.json`](./.jhweb.json).

The deploy flow builds a clean `dist/` bundle and uploads that bundle to Cloudflare Pages, so non-site repo files like `Design System/`, `research/`, and local source material are not published.
