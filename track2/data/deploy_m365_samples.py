#!/usr/bin/env python3
"""Deploy generated Track2 sample content to an isolated Microsoft 365 tenant."""

from __future__ import annotations

import argparse
import html
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
GENERATED = ROOT / "generated"
VALID_SOURCES = {"sharepoint", "outlook", "teams", "onedrive"}


class GraphError(RuntimeError):
    """Raised when Microsoft Graph rejects a deployment operation."""


class GraphClient:
    def __init__(self, base_url: str, token: str, execute: bool) -> None:
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.execute = execute

    def request(
        self,
        method: str,
        endpoint: str,
        *,
        json_body: dict[str, Any] | None = None,
        binary_body: bytes | None = None,
        content_type: str = "application/json",
        allowed_statuses: set[int] | None = None,
    ) -> tuple[int, bytes]:
        allowed = allowed_statuses or set()
        if not self.execute:
            print(f"[DRY-RUN] {method} {endpoint}")
            return 200, b"{}"

        body: bytes | None = binary_body
        if json_body is not None:
            body = json.dumps(json_body, ensure_ascii=False).encode("utf-8")

        request = urllib.request.Request(
            f"{self.base_url}{endpoint}",
            data=body,
            method=method,
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": content_type,
                "Accept": "application/json",
            },
        )
        delays = [0, 5, 10, 20]
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


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise RuntimeError(f"Required file not found: {path}") from error
    except json.JSONDecodeError as error:
        raise RuntimeError(f"Invalid JSON in {path}: {error}") from error


def require_value(config: dict[str, Any], dotted_path: str) -> Any:
    value: Any = config
    for key in dotted_path.split("."):
        if not isinstance(value, dict) or key not in value:
            raise RuntimeError(f"Missing deployment config value: {dotted_path}")
        value = value[key]
    if isinstance(value, str) and (not value.strip() or value.startswith("<")):
        raise RuntimeError(f"Replace placeholder deployment config value: {dotted_path}")
    return value


def encoded_path(parts: list[str]) -> str:
    return "/".join(urllib.parse.quote(part, safe="") for part in parts)


def ensure_drive_folder(client: GraphClient, drive_prefix: str, parts: list[str]) -> None:
    current: list[str] = []
    for part in parts:
        parent = list(current)
        current.append(part)
        lookup = f"{drive_prefix}/root:/{encoded_path(current)}"
        status, _ = client.request_json("GET", lookup, allowed_statuses={404})
        if status != 404:
            continue
        parent_endpoint = (
            f"{drive_prefix}/root/children"
            if not parent
            else f"{drive_prefix}/root:/{encoded_path(parent)}:/children"
        )
        client.request_json(
            "POST",
            parent_endpoint,
            json_body={
                "name": part,
                "folder": {},
                "@microsoft.graph.conflictBehavior": "fail",
            },
            allowed_statuses={409},
        )


def upload_documents(
    client: GraphClient,
    catalog: list[dict[str, Any]],
    source: str,
    drive_prefix: str,
    root_folder: str,
) -> None:
    items = [item for item in catalog if item["source"] == source]
    ensure_drive_folder(client, drive_prefix, [root_folder])
    for item in items:
        source_file = GENERATED / item["location"]
        if not source_file.is_file():
            raise RuntimeError(f"Generated document missing: {source_file}")
        target_parts = [root_folder, *Path(item["target"]).parts[2:]]
        ensure_drive_folder(client, drive_prefix, target_parts[:-1])
        endpoint = f"{drive_prefix}/root:/{encoded_path(target_parts)}:/content"
        client.request(
            "PUT",
            endpoint,
            binary_body=source_file.read_bytes(),
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        print(f"[{source}] uploaded {item['id']} -> /{'/'.join(target_parts)}")


def recipient(address: str) -> dict[str, Any]:
    return {"emailAddress": {"address": address}}


def deploy_outlook(
    client: GraphClient,
    messages: list[dict[str, Any]],
    config: dict[str, Any],
) -> None:
    senders = require_value(config, "outlook.senders")
    recipients = require_value(config, "outlook.recipients")
    for message in messages:
        sender_key = message["sender"]
        if sender_key not in senders:
            raise RuntimeError(f"No Outlook sender configured for role: {sender_key}")
        missing = [key for key in [*message["to"], *message["cc"]] if key not in recipients]
        if missing:
            raise RuntimeError(f"No Outlook recipient configured for roles: {missing}")

        business_timestamp = html.escape(message["date"])
        paragraphs = [
            f"<p><strong>업무 기준 시각:</strong> {business_timestamp}</p>",
            *[f"<p>{html.escape(text)}</p>" for text in message["body"]],
            "<p><em>본 메일은 Track2 워크숍용 가상 콘텐츠입니다.</em></p>",
        ]
        payload = {
            "message": {
                "subject": message["subject"],
                "body": {"contentType": "HTML", "content": "".join(paragraphs)},
                "toRecipients": [recipient(recipients[key]) for key in message["to"]],
                "ccRecipients": [recipient(recipients[key]) for key in message["cc"]],
                "internetMessageHeaders": [
                    {"name": "X-Track2-Sample", "value": "true"},
                    {"name": "X-Track2-Thread", "value": message["thread"]},
                    {"name": "X-Track2-Content-ID", "value": message["id"]},
                ],
            },
            "saveToSentItems": True,
        }
        sender = urllib.parse.quote(senders[sender_key], safe="")
        client.request_json("POST", f"/users/{sender}/sendMail", json_body=payload)
        print(f"[Outlook] sent {message['id']} as {sender_key}: {message['subject']}")


def team_message_body(role: str, business_timestamp: str, text: str) -> str:
    return (
        f"<p><strong>{html.escape(role)}</strong> "
        f"<small>(업무 기준 시각 {html.escape(business_timestamp)})</small></p>"
        f"<p>{html.escape(text)}</p>"
        "<p><em>Track2 워크숍용 가상 콘텐츠</em></p>"
    )


def deploy_teams(
    client: GraphClient,
    threads: list[dict[str, Any]],
    config: dict[str, Any],
) -> None:
    channels = require_value(config, "teams.channels")
    for thread in threads:
        channel_key = thread["channel"]
        if channel_key not in channels:
            raise RuntimeError(f"No Teams channel configured for key: {channel_key}")
        team_id = urllib.parse.quote(require_channel_value(channels, channel_key, "teamId"), safe="")
        channel_id = urllib.parse.quote(
            require_channel_value(channels, channel_key, "channelId"), safe=""
        )
        endpoint = f"/teams/{team_id}/channels/{channel_id}/messages"
        first_role, first_time, first_text = thread["messages"][0]
        _, response = client.request_json(
            "POST",
            endpoint,
            json_body={
                "subject": thread["title"],
                "body": {
                    "contentType": "html",
                    "content": team_message_body(first_role, first_time, first_text),
                },
            },
        )
        message_id = response.get("id")
        if client.execute and not message_id:
            raise GraphError(f"Teams root message {thread['id']} returned no message id")
        for role, timestamp, text in thread["messages"][1:]:
            reply_endpoint = (
                f"{endpoint}/{urllib.parse.quote(message_id or '<ROOT_MESSAGE_ID>', safe='')}/replies"
            )
            client.request_json(
                "POST",
                reply_endpoint,
                json_body={
                    "body": {
                        "contentType": "html",
                        "content": team_message_body(role, timestamp, text),
                    }
                },
            )
        print(
            f"[Teams] posted {thread['id']} to {channel_key} "
            f"({len(thread['messages'])} messages)"
        )


def require_channel_value(
    channels: dict[str, Any], channel_key: str, field: str
) -> str:
    value = channels[channel_key].get(field)
    if not isinstance(value, str) or not value or value.startswith("<"):
        raise RuntimeError(
            f"Replace placeholder deployment config value: teams.channels.{channel_key}.{field}"
        )
    return value


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Deploy generated Track2 samples to an isolated M365 tenant."
    )
    parser.add_argument(
        "--config",
        type=Path,
        default=ROOT / "deployment_config.json",
        help="Deployment configuration copied from deployment_config.example.json.",
    )
    parser.add_argument(
        "--sources",
        nargs="+",
        choices=sorted(VALID_SOURCES),
        default=sorted(VALID_SOURCES),
        help="Sources to validate or deploy.",
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Perform Graph writes. Without this flag the script only prints a dry run.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not GENERATED.is_dir():
        raise RuntimeError("Generated samples are missing. Run `npm run generate` first.")
    config = load_json(args.config)
    token = os.getenv("GRAPH_ACCESS_TOKEN", "")
    if args.execute and not token:
        raise RuntimeError("Set GRAPH_ACCESS_TOKEN before using --execute.")

    graph_base = config.get("graphBaseUrl", "https://graph.microsoft.com/v1.0")
    client = GraphClient(graph_base, token, args.execute)
    selected = set(args.sources)
    catalog = load_json(GENERATED / "manifests" / "content_catalog.json")

    if "sharepoint" in selected:
        site_id = urllib.parse.quote(require_value(config, "sharePoint.siteId"), safe="")
        drive_id = urllib.parse.quote(require_value(config, "sharePoint.driveId"), safe="")
        root_folder = require_value(config, "sharePoint.rootFolder")
        upload_documents(
            client,
            catalog,
            "SharePoint",
            f"/sites/{site_id}/drives/{drive_id}",
            root_folder,
        )

    if "onedrive" in selected:
        user_id = urllib.parse.quote(require_value(config, "oneDrive.userId"), safe="")
        root_folder = require_value(config, "oneDrive.rootFolder")
        upload_documents(
            client,
            catalog,
            "OneDrive",
            f"/users/{user_id}/drive",
            root_folder,
        )

    if "outlook" in selected:
        deploy_outlook(
            client,
            load_json(GENERATED / "outlook" / "messages.json"),
            config,
        )

    if "teams" in selected:
        deploy_teams(
            client,
            load_json(GENERATED / "teams" / "threads.json"),
            config,
        )

    print("Deployment completed." if args.execute else "Dry run completed; no M365 data was changed.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (RuntimeError, GraphError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        sys.exit(1)
