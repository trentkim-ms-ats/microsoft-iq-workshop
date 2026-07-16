#!/usr/bin/env python3
"""Bootstrap Track2 M365 prerequisites (app registration, consent, Teams, config)."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
GRAPH_BASE = "https://graph.microsoft.com/v1.0"
GRAPH_APP_ID = "00000003-0000-0000-c000-000000000000"
DEFAULT_DEVICE_LOGIN_CLIENT_ID = "04b07795-8ddb-461a-bbee-02f9e1bf7b46"

REQUIRED_APP_PERMISSIONS = {
    "Sites.ReadWrite.All",
    "Files.ReadWrite.All",
    "Mail.Send",
}

REQUIRED_DELEGATED_SCOPES = {
    "Group.ReadWrite.All",
    "Team.Create",
    "Channel.Create",
    "ChannelMessage.Send",
}

REQUIRED_BOOTSTRAP_SCOPES = sorted(
    {
        "Application.ReadWrite.All",
        "AppRoleAssignment.ReadWrite.All",
        "DelegatedPermissionGrant.ReadWrite.All",
        "Group.ReadWrite.All",
        "Team.Create",
        "Channel.Create",
    }
)

ROLE_ALIASES = {
    "ceo": "AdeleV",
    "cfo": "AlexW",
    "cdo": "DiegoS",
    "marketing": "MeganB",
    "growth": "GradyA",
    "payments": "PradeepG",
    "inventory": "NestorW",
    "logistics": "IsaiahL",
    "cs": "LynneR",
    "crm": "JohannaL",
    "data": "IrvinS",
    "finance": "PattiF",
}

CHANNEL_KEYS = [
    "cs-tier2",
    "inventory",
    "logistics",
    "payments",
    "campaign-ops",
    "data-quality",
    "leadership-briefing",
]


class GraphError(RuntimeError):
    """Raised when Graph API operation fails."""


class GraphClient:
    def __init__(self, token: str, execute: bool) -> None:
        self.token = token
        self.execute = execute

    def request(
        self,
        method: str,
        endpoint: str,
        *,
        json_body: dict[str, Any] | None = None,
        allowed_statuses: set[int] | None = None,
    ) -> tuple[int, bytes]:
        allowed = allowed_statuses or set()
        is_write = method in {"POST", "PATCH", "PUT", "DELETE"}
        if is_write and not self.execute:
            print(f"[DRY-RUN] {method} {endpoint}")
            return 200, b"{}"

        body: bytes | None = None
        if json_body is not None:
            body = json.dumps(json_body, ensure_ascii=False).encode("utf-8")

        request = urllib.request.Request(
            f"{GRAPH_BASE}{endpoint}",
            data=body,
            method=method,
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        )
        delays = [0, 3, 6, 12]
        for attempt, delay in enumerate(delays):
            if delay:
                time.sleep(delay)
            try:
                with urllib.request.urlopen(request, timeout=90) as response:
                    return response.status, response.read()
            except urllib.error.HTTPError as error:
                payload = error.read().decode("utf-8", errors="replace")
                if error.code in allowed:
                    return error.code, payload.encode("utf-8")
                if error.code in {429, 500, 502, 503, 504} and attempt < len(delays) - 1:
                    continue
                raise GraphError(
                    f"{method} {endpoint} failed with HTTP {error.code}: {payload}"
                ) from error
            except urllib.error.URLError as error:
                if attempt < len(delays) - 1:
                    continue
                raise GraphError(f"{method} {endpoint} failed: {error}") from error
        raise GraphError(f"{method} {endpoint} exhausted retries")

    def request_json(
        self,
        method: str,
        endpoint: str,
        *,
        json_body: dict[str, Any] | None = None,
        allowed_statuses: set[int] | None = None,
    ) -> tuple[int, dict[str, Any]]:
        status, payload = self.request(
            method,
            endpoint,
            json_body=json_body,
            allowed_statuses=allowed_statuses,
        )
        if not payload:
            return status, {}
        try:
            return status, json.loads(payload)
        except json.JSONDecodeError as error:
            raise GraphError(f"{method} {endpoint} returned invalid JSON") from error


def odata_query(base: str, **params: str) -> str:
    return f"{base}?{urllib.parse.urlencode(params)}"


def one(items: list[dict[str, Any]], label: str) -> dict[str, Any]:
    if not items:
        raise RuntimeError(f"Not found: {label}")
    return items[0]


def ensure_application(client: GraphClient, display_name: str) -> dict[str, Any]:
    safe_name = display_name.replace("'", "''")
    endpoint = odata_query(
        "/applications",
        **{
            "$filter": f"displayName eq '{safe_name}'",
            "$select": "id,appId,displayName",
        },
    )
    _, payload = client.request_json("GET", endpoint)
    items = payload.get("value", [])
    if items:
        app = items[0]
        print(f"[App] reuse: {app['displayName']} (appId={app['appId']})")
        return app

    _, app = client.request_json(
        "POST",
        "/applications",
        json_body={
            "displayName": display_name,
            "signInAudience": "AzureADMyOrg",
            "web": {"redirectUris": ["http://localhost"]},
        },
    )
    print(f"[App] created: {display_name} (appId={app.get('appId', 'n/a')})")
    return app


def ensure_service_principal(client: GraphClient, app_id: str) -> dict[str, Any]:
    endpoint = odata_query(
        "/servicePrincipals",
        **{
            "$filter": f"appId eq '{app_id}'",
            "$select": "id,appId,displayName",
        },
    )
    _, payload = client.request_json("GET", endpoint)
    items = payload.get("value", [])
    if items:
        sp = items[0]
        print(f"[SP] reuse: {sp.get('displayName', app_id)} (id={sp['id']})")
        return sp

    _, sp = client.request_json("POST", "/servicePrincipals", json_body={"appId": app_id})
    print(f"[SP] created for appId={app_id} (id={sp.get('id', 'n/a')})")
    return sp


def fetch_graph_sp(client: GraphClient) -> dict[str, Any]:
    endpoint = odata_query(
        "/servicePrincipals",
        **{
            "$filter": f"appId eq '{GRAPH_APP_ID}'",
            "$select": "id,appId,appRoles,publishedPermissionScopes",
        },
    )
    _, payload = client.request_json("GET", endpoint)
    return one(payload.get("value", []), "Microsoft Graph service principal")


def ensure_app_permissions(
    client: GraphClient,
    client_sp_id: str,
    graph_sp: dict[str, Any],
) -> None:
    graph_sp_id = graph_sp["id"]
    app_roles = graph_sp.get("appRoles", [])
    role_ids: dict[str, str] = {}
    for role in app_roles:
        value = role.get("value")
        if value in REQUIRED_APP_PERMISSIONS and "Application" in role.get("allowedMemberTypes", []):
            role_ids[value] = role["id"]
    missing_defs = sorted(REQUIRED_APP_PERMISSIONS - set(role_ids))
    if missing_defs:
        raise RuntimeError(f"Graph app role definitions not found: {missing_defs}")

    endpoint = odata_query(
        f"/servicePrincipals/{urllib.parse.quote(client_sp_id, safe='')}/appRoleAssignments",
        **{"$select": "id,appRoleId,resourceId"},
    )
    _, payload = client.request_json("GET", endpoint)
    existing = {
        (item.get("resourceId"), item.get("appRoleId"))
        for item in payload.get("value", [])
    }

    for permission in sorted(REQUIRED_APP_PERMISSIONS):
        app_role_id = role_ids[permission]
        key = (graph_sp_id, app_role_id)
        if key in existing:
            print(f"[Consent][App] already granted: {permission}")
            continue
        client.request_json(
            "POST",
            f"/servicePrincipals/{urllib.parse.quote(client_sp_id, safe='')}/appRoleAssignments",
            json_body={
                "principalId": client_sp_id,
                "resourceId": graph_sp_id,
                "appRoleId": app_role_id,
            },
        )
        print(f"[Consent][App] granted: {permission}")


def ensure_delegated_permissions(
    client: GraphClient,
    client_sp_id: str,
    graph_sp_id: str,
) -> None:
    endpoint = odata_query(
        "/oauth2PermissionGrants",
        **{
            "$filter": (
                f"clientId eq '{client_sp_id}' and "
                f"resourceId eq '{graph_sp_id}' and consentType eq 'AllPrincipals'"
            ),
            "$select": "id,scope",
        },
    )
    _, payload = client.request_json("GET", endpoint)
    grants = payload.get("value", [])
    merged_scopes = sorted(REQUIRED_DELEGATED_SCOPES)

    if grants:
        grant = grants[0]
        existing = set((grant.get("scope") or "").split())
        merged_scopes = sorted(existing | REQUIRED_DELEGATED_SCOPES)
        client.request_json(
            "PATCH",
            f"/oauth2PermissionGrants/{urllib.parse.quote(grant['id'], safe='')}",
            json_body={"scope": " ".join(merged_scopes)},
        )
        print("[Consent][Delegated] updated org-wide consent scopes")
        return

    client.request_json(
        "POST",
        "/oauth2PermissionGrants",
        json_body={
            "clientId": client_sp_id,
            "consentType": "AllPrincipals",
            "resourceId": graph_sp_id,
            "scope": " ".join(merged_scopes),
        },
    )
    print("[Consent][Delegated] created org-wide consent scopes")


def create_client_secret(
    client: GraphClient,
    app_object_id: str,
    display_name: str,
    valid_days: int,
) -> str | None:
    end_time = dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=valid_days)
    _, payload = client.request_json(
        "POST",
        f"/applications/{urllib.parse.quote(app_object_id, safe='')}/addPassword",
        json_body={
            "passwordCredential": {
                "displayName": display_name,
                "endDateTime": end_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            }
        },
    )
    secret = payload.get("secretText")
    if client.execute and not secret:
        raise RuntimeError("Client secret was not returned by Graph addPassword.")
    return secret


def resolve_site_and_drive(
    client: GraphClient,
    hostname: str,
    site_path: str,
) -> tuple[str, str]:
    normalized_path = site_path if site_path.startswith("/") else f"/{site_path}"
    site_ref = f"{hostname}:{normalized_path}"
    endpoint = odata_query(
        f"/sites/{urllib.parse.quote(site_ref, safe=':/')}",
        **{"$select": "id,displayName,webUrl"},
    )
    _, site = client.request_json("GET", endpoint)
    site_id = site.get("id")
    if not site_id:
        raise RuntimeError(f"SharePoint site lookup returned no id for {site_ref}")

    drives_endpoint = odata_query(
        f"/sites/{urllib.parse.quote(site_id, safe='')}/drives",
        **{"$select": "id,name"},
    )
    _, drives_payload = client.request_json("GET", drives_endpoint)
    drives = drives_payload.get("value", [])
    docs = [drive for drive in drives if drive.get("name") in {"Documents", "문서"}]
    drive = docs[0] if docs else (drives[0] if drives else None)
    if not drive or not drive.get("id"):
        raise RuntimeError("No SharePoint document library drive was found on target site.")

    print(f"[SharePoint] site={site.get('displayName', site_id)}")
    print(f"[SharePoint] drive={drive.get('name', drive['id'])}")
    return site_id, drive["id"]


def get_team_by_name(client: GraphClient, team_name: str) -> dict[str, Any] | None:
    safe_name = team_name.replace("'", "''")
    endpoint = odata_query(
        "/groups",
        **{
            "$filter": f"displayName eq '{safe_name}'",
            "$select": "id,displayName,resourceProvisioningOptions",
        },
    )
    _, payload = client.request_json("GET", endpoint)
    for group in payload.get("value", []):
        options = set(group.get("resourceProvisioningOptions", []))
        if "Team" in options:
            return group
    return None


def ensure_team(client: GraphClient, team_name: str, team_description: str) -> str:
    existing = get_team_by_name(client, team_name)
    if existing:
        print(f"[Teams] reuse team: {team_name} ({existing['id']})")
        return existing["id"]

    client.request_json(
        "POST",
        "/teams",
        json_body={
            "template@odata.bind": "https://graph.microsoft.com/v1.0/teamsTemplates('standard')",
            "displayName": team_name,
            "description": team_description,
        },
    )
    print(f"[Teams] create requested: {team_name}")
    if not client.execute:
        return "<TEAM_ID>"

    for _ in range(18):
        time.sleep(5)
        team = get_team_by_name(client, team_name)
        if team:
            print(f"[Teams] created: {team_name} ({team['id']})")
            return team["id"]
    raise RuntimeError(f"Team creation did not complete in time: {team_name}")


def ensure_channels(client: GraphClient, team_id: str) -> dict[str, str]:
    if team_id.startswith("<"):
        return {key: f"<{key.upper().replace('-', '_')}_CHANNEL_ID>" for key in CHANNEL_KEYS}

    endpoint = odata_query(
        f"/teams/{urllib.parse.quote(team_id, safe='')}/channels",
        **{"$select": "id,displayName"},
    )
    _, payload = client.request_json("GET", endpoint)
    existing = {
        channel.get("displayName", "").lower(): channel.get("id", "")
        for channel in payload.get("value", [])
    }
    result: dict[str, str] = {}

    for key in CHANNEL_KEYS:
        current = existing.get(key.lower())
        if current:
            print(f"[Teams] reuse channel: {key}")
            result[key] = current
            continue
        _, created = client.request_json(
            "POST",
            f"/teams/{urllib.parse.quote(team_id, safe='')}/channels",
            json_body={
                "displayName": key,
                "description": "Track2 workshop sample channel",
                "membershipType": "standard",
            },
        )
        channel_id = created.get("id", f"<{key.upper().replace('-', '_')}_CHANNEL_ID>")
        print(f"[Teams] created channel: {key}")
        result[key] = channel_id
    return result


def build_role_addresses(tenant_domain: str) -> dict[str, str]:
    return {key: f"{alias}@{tenant_domain}" for key, alias in ROLE_ALIASES.items()}


def load_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise RuntimeError(f"Required file not found: {path}") from error
    except json.JSONDecodeError as error:
        raise RuntimeError(f"Invalid JSON in {path}: {error}") from error


def request_device_code(tenant: str, client_id: str, scopes: list[str]) -> dict[str, Any]:
    endpoint = f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/devicecode"
    form = urllib.parse.urlencode(
        {
            "client_id": client_id,
            "scope": " ".join(scopes),
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        endpoint,
        data=form,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        payload = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"Device code request failed with HTTP {error.code}: {payload}"
        ) from error


def acquire_admin_token_device_code(
    tenant: str,
    client_id: str,
    scopes: list[str],
) -> str:
    payload = request_device_code(tenant, client_id, scopes)
    device_code = payload.get("device_code")
    if not isinstance(device_code, str) or not device_code:
        raise RuntimeError("Device login response missing device_code.")
    message = payload.get("message")
    if isinstance(message, str) and message.strip():
        print(f"\n[Device Login]\n{message}\n")
    interval = int(payload.get("interval", 5))
    expires_in = int(payload.get("expires_in", 900))
    deadline = time.time() + expires_in
    token_endpoint = f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"

    while time.time() < deadline:
        time.sleep(interval)
        form = urllib.parse.urlencode(
            {
                "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
                "client_id": client_id,
                "device_code": device_code,
            }
        ).encode("utf-8")
        request = urllib.request.Request(
            token_endpoint,
            data=form,
            method="POST",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                token_payload = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            error_payload_raw = error.read().decode("utf-8", errors="replace")
            try:
                error_payload = json.loads(error_payload_raw)
            except json.JSONDecodeError as parse_error:
                raise RuntimeError(
                    f"Device login token polling failed with HTTP {error.code}: {error_payload_raw}"
                ) from parse_error
            error_code = error_payload.get("error")
            description = error_payload.get("error_description", "")
            if error_code == "authorization_pending":
                continue
            if error_code == "slow_down":
                interval += 5
                continue
            if error_code in {"authorization_declined", "expired_token", "bad_verification_code"}:
                raise RuntimeError(f"Device login failed: {error_code} ({description})")
            raise RuntimeError(f"Device login failed: {error_code} ({description})")

        token = token_payload.get("access_token")
        if isinstance(token, str) and token:
            return token
        raise RuntimeError("Device login completed but no access_token was returned.")

    raise RuntimeError("Timed out waiting for device login completion.")


def write_config(
    template_path: Path,
    output_path: Path,
    *,
    site_id: str,
    drive_id: str,
    one_drive_user: str,
    tenant_domain: str,
    team_id: str,
    channel_ids: dict[str, str],
) -> None:
    config = load_json(template_path)
    config.setdefault("sharePoint", {})
    config["sharePoint"]["siteId"] = site_id
    config["sharePoint"]["driveId"] = drive_id
    config["sharePoint"].setdefault("rootFolder", "Track2-Sample")

    config.setdefault("oneDrive", {})
    config["oneDrive"]["userId"] = one_drive_user
    config["oneDrive"].setdefault("rootFolder", "Track2-Sample")

    addresses = build_role_addresses(tenant_domain)
    config.setdefault("outlook", {})
    config["outlook"]["senders"] = addresses
    config["outlook"]["recipients"] = addresses

    config.setdefault("teams", {})
    config["teams"]["channels"] = {
        key: {"teamId": team_id, "channelId": channel_ids[key]} for key in CHANNEL_KEYS
    }

    output_path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[Config] wrote: {output_path}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Bootstrap Track2 M365 prerequisites. "
            "Dry-run by default; add --execute to perform tenant write operations."
        )
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Perform tenant write operations (app/team/channel/consent).",
    )
    parser.add_argument(
        "--admin-token-env",
        default="GRAPH_ADMIN_TOKEN",
        help="Environment variable that contains delegated admin Graph token.",
    )
    parser.add_argument(
        "--no-interactive-admin-login",
        action="store_true",
        help="Disable device-code login fallback when admin token env var is missing.",
    )
    parser.add_argument(
        "--device-login-client-id",
        default=DEFAULT_DEVICE_LOGIN_CLIENT_ID,
        help="Public client ID used for device-code admin login fallback.",
    )
    parser.add_argument(
        "--app-display-name",
        default="Track2-Workshop-Deployer",
        help="Display name for Azure app registration.",
    )
    parser.add_argument(
        "--create-client-secret",
        action="store_true",
        help="Create a new client secret and print it once.",
    )
    parser.add_argument(
        "--secret-display-name",
        default="Track2-Workshop-Deployer-Secret",
        help="Display name for new client secret.",
    )
    parser.add_argument(
        "--secret-valid-days",
        type=int,
        default=730,
        help="Client secret validity (days) when --create-client-secret is used.",
    )
    parser.add_argument(
        "--tenant-domain",
        required=True,
        help="Tenant domain used for role account UPN mapping (e.g. M365DS060811.onmicrosoft.com).",
    )
    parser.add_argument(
        "--sharepoint-hostname",
        required=True,
        help="SharePoint hostname (e.g. m365ds060811.sharepoint.com).",
    )
    parser.add_argument(
        "--sharepoint-site-path",
        default="/sites/Track2WorkshopSample",
        help="SharePoint site path (default: /sites/Track2WorkshopSample).",
    )
    parser.add_argument(
        "--one-drive-user",
        help="OneDrive target user UPN/ID for Track2 upload.",
    )
    parser.add_argument(
        "--team-name",
        default="Track2 Workshop (Sample)",
        help="Teams team display name.",
    )
    parser.add_argument(
        "--team-description",
        default="Track2 workshop sample data collaboration space",
        help="Teams team description.",
    )
    parser.add_argument(
        "--template-config",
        type=Path,
        default=ROOT / "deployment_config.example.json",
        help="Template config file.",
    )
    parser.add_argument(
        "--output-config",
        type=Path,
        default=ROOT / "deployment_config.json",
        help="Output deployment config file.",
    )
    parser.add_argument(
        "--summary-output",
        type=Path,
        help="Optional JSON output path for machine-readable bootstrap summary.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    token = os.getenv(args.admin_token_env, "").strip()
    if not token:
        if args.no_interactive_admin_login:
            raise RuntimeError(f"Set {args.admin_token_env} before running bootstrap.")
        token = acquire_admin_token_device_code(
            tenant=args.tenant_domain,
            client_id=args.device_login_client_id,
            scopes=REQUIRED_BOOTSTRAP_SCOPES,
        )
        print("[Auth] acquired delegated admin token via device login")
        admin_token_source = "device_code"
    else:
        admin_token_source = "env"

    one_drive_user = args.one_drive_user or f"admin@{args.tenant_domain}"
    client = GraphClient(token, args.execute)

    app = ensure_application(client, args.app_display_name)
    app_id = app.get("appId")
    app_object_id = app.get("id")
    if not app_id or not app_object_id:
        raise RuntimeError("App registration response missing appId or object id.")

    app_sp = ensure_service_principal(client, app_id)
    app_sp_id = app_sp.get("id")
    if not app_sp_id:
        raise RuntimeError("Service principal response missing id.")

    graph_sp = fetch_graph_sp(client)
    graph_sp_id = graph_sp.get("id")
    if not graph_sp_id:
        raise RuntimeError("Graph service principal id missing.")

    ensure_app_permissions(client, app_sp_id, graph_sp)
    ensure_delegated_permissions(client, app_sp_id, graph_sp_id)

    secret_text: str | None = None
    if args.create_client_secret:
        secret_text = create_client_secret(
            client,
            app_object_id,
            args.secret_display_name,
            args.secret_valid_days,
        )

    site_id, drive_id = resolve_site_and_drive(
        client,
        args.sharepoint_hostname,
        args.sharepoint_site_path,
    )
    team_id = ensure_team(client, args.team_name, args.team_description)
    channel_ids = ensure_channels(client, team_id)

    write_config(
        args.template_config,
        args.output_config,
        site_id=site_id,
        drive_id=drive_id,
        one_drive_user=one_drive_user,
        tenant_domain=args.tenant_domain,
        team_id=team_id,
        channel_ids=channel_ids,
    )

    print("\n=== Bootstrap summary ===")
    print(f"execute={args.execute}")
    print(f"appId={app_id}")
    print(f"tenantDomain={args.tenant_domain}")
    print(f"sharePoint.siteId={site_id}")
    print(f"sharePoint.driveId={drive_id}")
    print(f"teams.teamId={team_id}")
    print(f"adminTokenSource={admin_token_source}")
    print(f"outputConfig={args.output_config}")
    if args.create_client_secret:
        if args.execute and secret_text:
            print("\n[Client Secret] Copy now (shown only once):")
            print(secret_text)
        else:
            print("\n[Client Secret] Dry-run mode: no secret was created.")

    consent_url = (
        "https://login.microsoftonline.com/common/adminconsent?"
        + urllib.parse.urlencode({"client_id": app_id})
    )
    print(f"\n[Admin consent URL]\n{consent_url}")

    if args.summary_output:
        summary_payload = {
            "execute": args.execute,
            "appId": app_id,
            "tenantDomain": args.tenant_domain,
            "sharePoint": {"siteId": site_id, "driveId": drive_id},
            "teams": {"teamId": team_id, "channels": channel_ids},
            "adminTokenSource": admin_token_source,
            "outputConfig": str(args.output_config),
            "clientSecretCreated": bool(args.create_client_secret and args.execute and secret_text),
            "clientSecret": secret_text if args.execute and secret_text else None,
            "adminConsentUrl": consent_url,
        }
        args.summary_output.write_text(
            json.dumps(summary_payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"[Summary] wrote: {args.summary_output}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (RuntimeError, GraphError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        sys.exit(1)
