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
./jhweb latch signups
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

## Latch beta-download signups

Latch asks for one email address, stores the signup under a dedicated prefix in the site's Cloudflare KV binding, then streams the beta DMG immediately. The public DMG route is blocked so the download remains behind the form. Fetch the CSV with the same admin token:

```bash
JHWEB_ADMIN_TOKEN=... ./jhweb latch signups
JHWEB_ADMIN_TOKEN=... ./jhweb latch signups --output latch-signups.csv
```
