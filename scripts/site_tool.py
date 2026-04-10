#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / ".jhweb.json"
BUILD_DIR = ROOT / "dist"

DEFAULT_CONFIG: dict[str, Any] = {
    "deployment": {
        "provider": "cloudflare-pages",
        "project_name": "jhneves-website",
        "production_branch": "main",
        "deploy_dir": "dist",
        "production_url": "",
        "pages_domain": "https://jhneves-website.pages.dev",
    }
}

STATIC_ROOT_FILES = [
    "script.js",
    "styles.css",
]

PUBLIC_DIRS = ["assets"]


def public_root_files() -> list[str]:
    html_files = sorted(path.name for path in ROOT.glob("*.html"))
    return [*html_files, *STATIC_ROOT_FILES]


def required_site_files() -> list[Path]:
    return [ROOT / path for path in [*public_root_files(), *PUBLIC_DIRS]]


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def load_config() -> dict[str, Any]:
    config = json.loads(json.dumps(DEFAULT_CONFIG))
    if CONFIG_PATH.exists():
        existing = load_json(CONFIG_PATH)
        deployment = existing.get("deployment") if isinstance(existing, dict) else None
        if isinstance(deployment, dict):
            config["deployment"].update({k: v for k, v in deployment.items() if v not in (None, "")})
    return config


def save_config(config: dict[str, Any]) -> None:
    CONFIG_PATH.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")


def deploy_settings() -> dict[str, Any]:
    return load_config()["deployment"]


def ensure_required_site_files() -> None:
    missing = [str(path.relative_to(ROOT)) for path in required_site_files() if not path.exists()]
    if missing:
        raise RuntimeError(f"Missing required site files: {', '.join(missing)}")


def wrangler_command(override: str | None = None) -> list[str]:
    if override:
        return override.split()
    installed = shutil.which("wrangler")
    if installed:
        return [installed]
    npx = shutil.which("npx")
    if npx:
        return [npx, "--yes", "wrangler@latest"]
    raise RuntimeError("Wrangler is not installed and `npx` is not available.")


def run_wrangler(*args: str, wrangler_bin: str | None = None, capture_output: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [*wrangler_command(wrangler_bin), *args],
        cwd=ROOT,
        text=True,
        capture_output=capture_output,
        check=False,
    )


def ensure_build_dir_clean() -> None:
    if BUILD_DIR.exists():
        shutil.rmtree(BUILD_DIR)
    BUILD_DIR.mkdir(parents=True, exist_ok=True)


def build_site_bundle() -> Path:
    ensure_required_site_files()
    ensure_build_dir_clean()

    for filename in public_root_files():
        shutil.copy2(ROOT / filename, BUILD_DIR / filename)

    for dirname in PUBLIC_DIRS:
        shutil.copytree(ROOT / dirname, BUILD_DIR / dirname)

    return BUILD_DIR


def cloudflare_project_name(args_project_name: str | None = None) -> str:
    return str(args_project_name or deploy_settings()["project_name"]).strip()


def cloudflare_branch_name(args_branch_name: str | None = None) -> str:
    return str(args_branch_name or deploy_settings()["production_branch"]).strip()


def print_cloudflare_hint(project_name: str) -> None:
    print(
        "If Cloudflare is not set up yet, run `jhweb site login` once and then "
        f"`jhweb site init-cloudflare --project-name {project_name}`."
    )


def handle_site_status(args: argparse.Namespace) -> int:
    settings = deploy_settings()
    print("Deployment provider: Cloudflare Pages")
    print(f"Project name: {settings['project_name']}")
    print(f"Production branch: {settings['production_branch']}")
    print(f"Deploy directory: {settings['deploy_dir']}")
    print(f"Production URL: {settings.get('production_url') or '(not set)'}")
    print(f"Pages domain: {settings.get('pages_domain') or '(not set)'}")

    if not args.cloudflare:
        print("For live Cloudflare project details, run `jhweb site status --cloudflare`.")
        return 0

    project_result = run_wrangler("pages", "project", "list", wrangler_bin=args.wrangler_bin)
    if project_result.returncode != 0:
        print(f"Cloudflare query failed: {(project_result.stderr or project_result.stdout).strip()}", file=sys.stderr)
        return project_result.returncode

    if project_result.stdout.strip():
        print("\nCloudflare Pages projects:")
        print(project_result.stdout.strip())

    deployment_result = run_wrangler(
        "pages",
        "deployment",
        "list",
        "--project-name",
        settings["project_name"],
        wrangler_bin=args.wrangler_bin,
    )
    if deployment_result.returncode == 0 and deployment_result.stdout.strip():
        print(f"\nRecent deployments for {settings['project_name']}:")
        print(deployment_result.stdout.strip())

    return 0


def handle_site_config(args: argparse.Namespace) -> int:
    config = load_config()
    deployment = config["deployment"]
    updates = {
        "project_name": args.project_name,
        "production_branch": args.production_branch,
        "production_url": args.production_url,
        "pages_domain": args.pages_domain,
    }
    changed = False
    for key, value in updates.items():
        if value is not None:
            deployment[key] = value.strip()
            changed = True

    if changed:
        save_config(config)
        print(f"Saved deployment config to {CONFIG_PATH.relative_to(ROOT)}.")

    print(json.dumps(config, indent=2))
    return 0


def handle_site_login(args: argparse.Namespace) -> int:
    result = run_wrangler("login", wrangler_bin=args.wrangler_bin, capture_output=False)
    return result.returncode


def handle_site_init_cloudflare(args: argparse.Namespace) -> int:
    project_name = cloudflare_project_name(args.project_name)
    production_branch = cloudflare_branch_name(args.production_branch)

    result = run_wrangler(
        "pages",
        "project",
        "create",
        project_name,
        "--production-branch",
        production_branch,
        wrangler_bin=args.wrangler_bin,
        capture_output=False,
    )
    if result.returncode != 0:
        return result.returncode

    config = load_config()
    config["deployment"]["project_name"] = project_name
    config["deployment"]["production_branch"] = production_branch
    save_config(config)

    print(f"Cloudflare Pages project `{project_name}` is ready.")
    print("Next: add the custom domain in Cloudflare Pages, then use `jhweb site upload` for deployments.")
    return 0


def handle_site_build(_: argparse.Namespace) -> int:
    try:
        build_dir = build_site_bundle()
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    print(f"Built deployable site bundle at {build_dir.relative_to(ROOT)}.")
    return 0


def handle_site_upload(args: argparse.Namespace) -> int:
    project_name = cloudflare_project_name(args.project_name)
    branch_name = cloudflare_branch_name(args.branch)

    try:
        build_dir = build_site_bundle()
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    print(f"Built deployable site bundle at {build_dir.relative_to(ROOT)}.")

    if args.skip_deploy:
        print("Skipping Cloudflare deployment because `--skip-deploy` was used.")
        return 0

    deploy_result = run_wrangler(
        "pages",
        "deploy",
        str(build_dir),
        "--project-name",
        project_name,
        "--branch",
        branch_name,
        "--commit-dirty=true",
        wrangler_bin=args.wrangler_bin,
        capture_output=False,
    )
    if deploy_result.returncode != 0:
        print_cloudflare_hint(project_name)
        return deploy_result.returncode

    production_url = deploy_settings().get("production_url") or deploy_settings().get("pages_domain")
    print(f"Cloudflare Pages deploy requested for `{project_name}`.")
    if production_url:
        print(f"Expected live URL: {production_url}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="jhweb", description="Build and deploy the JH Neves portfolio site.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    site_parser = subparsers.add_parser("site", help="Build and deploy the website.")
    site_subparsers = site_parser.add_subparsers(dest="site_command", required=True)

    status_parser = site_subparsers.add_parser("status", help="Show local and Cloudflare deployment status.")
    status_parser.add_argument("--cloudflare", action="store_true", help="Also query Cloudflare Pages via Wrangler.")
    status_parser.add_argument("--wrangler-bin", help="Override the Wrangler command to use.")
    status_parser.set_defaults(func=handle_site_status)

    config_parser = site_subparsers.add_parser("config", help="Show or update deployment config.")
    config_parser.add_argument("--project-name", help="Cloudflare Pages project name.")
    config_parser.add_argument("--production-branch", help="Production branch name for Cloudflare Pages.")
    config_parser.add_argument("--production-url", help="Production domain, such as https://example.com.")
    config_parser.add_argument("--pages-domain", help="Cloudflare Pages fallback domain, such as https://project.pages.dev.")
    config_parser.set_defaults(func=handle_site_config)

    login_parser = site_subparsers.add_parser("login", help="Log in to Cloudflare via Wrangler.")
    login_parser.add_argument("--wrangler-bin", help="Override the Wrangler command to use.")
    login_parser.set_defaults(func=handle_site_login)

    init_parser = site_subparsers.add_parser("init-cloudflare", help="Create the Cloudflare Pages project.")
    init_parser.add_argument("--project-name", help="Cloudflare Pages project name.")
    init_parser.add_argument("--production-branch", help="Production branch name for Cloudflare Pages.")
    init_parser.add_argument("--wrangler-bin", help="Override the Wrangler command to use.")
    init_parser.set_defaults(func=handle_site_init_cloudflare)

    build_parser = site_subparsers.add_parser("build", help="Assemble a clean deployable site bundle in dist/.")
    build_parser.set_defaults(func=handle_site_build)

    upload_parser = site_subparsers.add_parser("upload", help="Build and deploy the site to Cloudflare Pages.")
    upload_parser.add_argument("--skip-deploy", action="store_true", help="Stop after building dist/.")
    upload_parser.add_argument("--branch", help="Override the deployment branch sent to Cloudflare Pages.")
    upload_parser.add_argument("--project-name", help="Override the configured Cloudflare Pages project name.")
    upload_parser.add_argument("--wrangler-bin", help="Override the Wrangler command to use.")
    upload_parser.set_defaults(func=handle_site_upload)

    publish_parser = subparsers.add_parser("publish", help="Build and deploy the site to Cloudflare Pages.")
    publish_parser.add_argument("--skip-deploy", action="store_true", help="Stop after building dist/.")
    publish_parser.add_argument("--branch", help="Override the deployment branch sent to Cloudflare Pages.")
    publish_parser.add_argument("--project-name", help="Override the configured Cloudflare Pages project name.")
    publish_parser.add_argument("--wrangler-bin", help="Override the Wrangler command to use.")
    publish_parser.set_defaults(func=handle_site_upload)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
