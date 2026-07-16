#!/usr/bin/env python3
"""Run Track2 bootstrap and deployment in one command."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
VALID_SOURCES = {"sharepoint", "outlook", "teams", "onedrive"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "One-click Track2 execution. "
            "Runs bootstrap_m365_prereqs.py then deploy_m365_samples.py."
        )
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Perform real writes. Without this flag both steps run in dry-run mode.",
    )
    parser.add_argument(
        "--generate",
        action="store_true",
        help="Regenerate Track2 sample content before bootstrap/deploy.",
    )
    parser.add_argument(
        "--admin-token-env",
        default="GRAPH_ADMIN_TOKEN",
        help="Environment variable containing delegated admin token for bootstrap.",
    )
    parser.add_argument(
        "--no-interactive-admin-login",
        action="store_true",
        help="Disable device-code login fallback when admin token env var is missing.",
    )
    parser.add_argument(
        "--device-login-client-id",
        default="04b07795-8ddb-461a-bbee-02f9e1bf7b46",
        help="Public client ID used for bootstrap device-code login fallback.",
    )
    parser.add_argument(
        "--access-token-env",
        default="GRAPH_ACCESS_TOKEN",
        help="Environment variable used by deploy_m365_samples.py for app token.",
    )
    parser.add_argument(
        "--tenant-domain",
        required=True,
        help="Tenant domain (e.g. M365DS060811.onmicrosoft.com).",
    )
    parser.add_argument(
        "--sharepoint-hostname",
        required=True,
        help="SharePoint hostname (e.g. m365ds060811.sharepoint.com).",
    )
    parser.add_argument(
        "--sharepoint-site-path",
        default="/sites/Track2WorkshopSample",
        help="SharePoint site path.",
    )
    parser.add_argument(
        "--one-drive-user",
        help="OneDrive user UPN/ID for Track2 upload target.",
    )
    parser.add_argument(
        "--team-name",
        default="Track2 Workshop (Sample)",
        help="Target Teams team display name.",
    )
    parser.add_argument(
        "--team-description",
        default="Track2 workshop sample data collaboration space",
        help="Target Teams team description.",
    )
    parser.add_argument(
        "--app-display-name",
        default="Track2-Workshop-Deployer",
        help="App registration display name.",
    )
    parser.add_argument(
        "--create-client-secret",
        action="store_true",
        help="Force creating a new client secret during bootstrap.",
    )
    parser.add_argument(
        "--secret-display-name",
        default="Track2-Workshop-Deployer-Secret",
        help="Display name for newly created client secret.",
    )
    parser.add_argument(
        "--secret-valid-days",
        type=int,
        default=730,
        help="Secret validity in days when created.",
    )
    parser.add_argument(
        "--template-config",
        type=Path,
        default=ROOT / "deployment_config.example.json",
        help="Template config path.",
    )
    parser.add_argument(
        "--config",
        type=Path,
        default=ROOT / "deployment_config.json",
        help="Output config path used by deployment.",
    )
    parser.add_argument(
        "--sources",
        nargs="+",
        choices=sorted(VALID_SOURCES),
        default=sorted(VALID_SOURCES),
        help="Sources to deploy.",
    )
    parser.add_argument(
        "--skip-bootstrap",
        action="store_true",
        help="Skip bootstrap phase and deploy with existing config/token.",
    )
    parser.add_argument(
        "--skip-deploy",
        action="store_true",
        help="Run bootstrap only.",
    )
    return parser.parse_args()


def run_command(command: list[str], env: dict[str, str], *, cwd: Path | None = None) -> None:
    print(f"[Run] {' '.join(command)}")
    subprocess.run(command, check=True, env=env, cwd=str(cwd) if cwd else None)


def run_generate(env: dict[str, str]) -> None:
    run_command(["npm", "run", "generate"], env, cwd=ROOT)


def request_app_token(tenant: str, client_id: str, client_secret: str) -> str:
    form = urllib.parse.urlencode(
        {
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret,
            "scope": "https://graph.microsoft.com/.default",
        }
    ).encode("utf-8")
    endpoint = f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"
    request = urllib.request.Request(
        endpoint,
        data=form,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        payload = json.loads(response.read().decode("utf-8"))
    token = payload.get("access_token")
    if not isinstance(token, str) or not token:
        raise RuntimeError("Token endpoint returned no access_token.")
    return token


def load_summary(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise RuntimeError(f"Bootstrap summary file not found: {path}") from error
    except json.JSONDecodeError as error:
        raise RuntimeError(f"Invalid bootstrap summary JSON: {error}") from error


def run_bootstrap(args: argparse.Namespace, env: dict[str, str]) -> dict[str, Any]:
    with tempfile.NamedTemporaryFile(prefix="track2-bootstrap-", suffix=".json", delete=False) as tmp:
        summary_path = Path(tmp.name)

    command = [
        sys.executable,
        str(ROOT / "bootstrap_m365_prereqs.py"),
        "--admin-token-env",
        args.admin_token_env,
        "--device-login-client-id",
        args.device_login_client_id,
        "--tenant-domain",
        args.tenant_domain,
        "--sharepoint-hostname",
        args.sharepoint_hostname,
        "--sharepoint-site-path",
        args.sharepoint_site_path,
        "--team-name",
        args.team_name,
        "--team-description",
        args.team_description,
        "--app-display-name",
        args.app_display_name,
        "--secret-display-name",
        args.secret_display_name,
        "--secret-valid-days",
        str(args.secret_valid_days),
        "--template-config",
        str(args.template_config),
        "--output-config",
        str(args.config),
        "--summary-output",
        str(summary_path),
    ]

    if args.one_drive_user:
        command.extend(["--one-drive-user", args.one_drive_user])
    if args.execute:
        command.append("--execute")
    if args.no_interactive_admin_login:
        command.append("--no-interactive-admin-login")

    current_access_token = env.get(args.access_token_env, "").strip()
    should_create_secret = args.create_client_secret or (args.execute and not current_access_token)
    if should_create_secret:
        command.append("--create-client-secret")

    try:
        run_command(command, env)
        return load_summary(summary_path)
    finally:
        summary_path.unlink(missing_ok=True)


def ensure_access_token(
    args: argparse.Namespace,
    env: dict[str, str],
    bootstrap_summary: dict[str, Any] | None,
) -> None:
    existing = env.get(args.access_token_env, "").strip()
    if existing:
        print(f"[Token] reuse {args.access_token_env}")
        return
    if not args.execute:
        return
    if bootstrap_summary is None:
        raise RuntimeError(
            f"{args.access_token_env} is required when using --skip-bootstrap with --execute."
        )

    app_id = bootstrap_summary.get("appId")
    client_secret = bootstrap_summary.get("clientSecret")
    if not isinstance(app_id, str) or not app_id:
        raise RuntimeError("Bootstrap summary missing appId; cannot acquire app token.")
    if not isinstance(client_secret, str) or not client_secret:
        raise RuntimeError(
            f"{args.access_token_env} is missing and no new client secret is available. "
            "Set token env manually or run without --skip-bootstrap so secret can be created."
        )

    token = request_app_token(args.tenant_domain, app_id, client_secret)
    env[args.access_token_env] = token
    print(f"[Token] acquired {args.access_token_env} via client credentials")


def run_deploy(args: argparse.Namespace, env: dict[str, str]) -> None:
    command = [
        sys.executable,
        str(ROOT / "deploy_m365_samples.py"),
        "--config",
        str(args.config),
        "--sources",
        *args.sources,
    ]
    if args.execute:
        command.append("--execute")
    run_command(command, env)


def main() -> int:
    args = parse_args()
    env = dict(os.environ)
    summary: dict[str, Any] | None = None

    if args.generate:
        run_generate(env)

    if not args.skip_bootstrap:
        summary = run_bootstrap(args, env)

    if not args.skip_deploy:
        ensure_access_token(args, env, summary)
        run_deploy(args, env)

    print("Track2 one-click flow completed.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (RuntimeError, subprocess.CalledProcessError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        sys.exit(1)
