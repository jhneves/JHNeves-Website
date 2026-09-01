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
./jhweb wingman signups
```

One-time Cloudflare setup:

```bash
./jhweb site login
./jhweb site init-cloudflare
```

Deployment config lives in [`.jhweb.json`](./.jhweb.json).

The deploy flow builds a clean `dist/` bundle and uploads that bundle to Cloudflare Pages, so non-site repo files like `Design System/`, `research/`, and local source material are not published.

## Wingman signups

Fetch the Wingman waitlist CSV from the protected `/api/signups` endpoint:

```bash
JHWEB_ADMIN_TOKEN=... ./jhweb wingman signups
JHWEB_ADMIN_TOKEN=... ./jhweb wingman signups --output waitlist.csv
```

The command uses `production_url` from [`.jhweb.json`](./.jhweb.json) by default. Use `--url` to query the Pages domain or a local preview instead.

Foldspell now lives in its own repository and is served from
`https://foldspell.com`. This site keeps only the `/latch` redirect.
