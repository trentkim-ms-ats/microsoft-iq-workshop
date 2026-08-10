#!/usr/bin/env python3
"""Send Track4 FoundryIQ daily briefing notifications to Teams and/or email.

The helper filename is retained as a legacy Track3 FoundryIQ identifier.
"""

from __future__ import annotations

import argparse
import json
import os
import smtplib
import ssl
import urllib.error
import urllib.request
from email.message import EmailMessage
from pathlib import Path
from typing import Any


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Send Track4 FoundryIQ daily briefing notifications.")
    parser.add_argument(
        "--reports-dir",
        type=Path,
        default=Path("track4/data/generated/reports"),
        help="Directory containing daily_run_metadata.json and briefing markdown.",
    )
    parser.add_argument(
        "--teams-webhook-url",
        default="",
        help="Microsoft Teams incoming webhook URL (optional).",
    )
    parser.add_argument(
        "--email-enabled",
        action="store_true",
        help="Enable SMTP email notification.",
    )
    parser.add_argument("--smtp-host", default="", help="SMTP host.")
    parser.add_argument("--smtp-port", type=int, default=587, help="SMTP port.")
    parser.add_argument("--smtp-user", default="", help="SMTP username.")
    # SMTP password is read from the SMTP_PASSWORD environment variable, not a CLI
    # argument, to prevent exposure in the OS process table (/proc/<pid>/cmdline).
    parser.add_argument("--email-from", default="", help="Sender email address.")
    parser.add_argument("--email-to", default="", help="Comma-separated recipient list.")
    parser.add_argument("--email-subject-prefix", default="[Track4 FoundryIQ Daily Briefing]", help="Email subject prefix.")
    return parser.parse_args()


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def build_summary(meta: dict[str, Any], report: dict[str, Any], briefing_path: Path) -> tuple[str, str]:
    title = "Track4 FoundryIQ daily briefing run completed"
    failed = report.get("failed", 0)
    passed = report.get("passed", 0)
    total = report.get("total", 0)
    status = "PASS" if failed == 0 else "FAIL"
    text = (
        f"Status: {status}\n"
        f"Passed/Total: {passed}/{total}\n"
        f"Pipeline: {meta.get('pipelineVersion', '-')}\n"
        f"Prompt: {meta.get('promptVersion', '-')}\n"
        f"Model: {meta.get('modelVersion', '-')}\n"
        f"Toolset: {meta.get('toolsetVersion', '-')}\n"
        f"GeneratedAtUtc: {meta.get('generatedAtUtc', '-')}\n"
        f"Briefing: {briefing_path}\n"
    )
    return title, text


def send_teams(webhook_url: str, title: str, text: str) -> None:
    rendered_text = text.replace("\n", "  \n")
    payload = {"text": f"**{title}**\n\n{rendered_text}"}
    request = urllib.request.Request(
        webhook_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            if response.status >= 400:
                raise RuntimeError(f"Teams webhook failed: HTTP {response.status}")
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Teams webhook request failed: {exc}") from exc


def send_email(
    *,
    smtp_host: str,
    smtp_port: int,
    smtp_user: str,
    smtp_password: str,
    email_from: str,
    email_to: str,
    subject: str,
    body: str,
) -> None:
    recipients = [value.strip() for value in email_to.split(",") if value.strip()]
    if not recipients:
        raise RuntimeError("email-to is empty")

    message = EmailMessage()
    message["From"] = email_from
    message["To"] = ", ".join(recipients)
    message["Subject"] = subject
    message.set_content(body)

    context = ssl.create_default_context()
    with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
        server.starttls(context=context)
        if smtp_user:
            server.login(smtp_user, smtp_password)
        server.send_message(message)


def main() -> None:
    args = parse_args()
    reports_dir = args.reports_dir.resolve()

    meta_path = reports_dir / "daily_run_metadata.json"
    report_path = reports_dir / "microsoft_iq_evaluation_report.json"
    briefing_path = reports_dir / "microsoft_iq_leadership_briefing.md"

    if not meta_path.is_file():
        raise RuntimeError(f"Missing metadata file: {meta_path}")
    if not report_path.is_file():
        raise RuntimeError(f"Missing evaluation report file: {report_path}")
    if not briefing_path.is_file():
        raise RuntimeError(f"Missing briefing file: {briefing_path}")

    meta = load_json(meta_path)
    report = load_json(report_path)
    title, text = build_summary(meta, report, briefing_path)

    sent = False
    if args.teams_webhook_url:
        send_teams(args.teams_webhook_url, title, text)
        print("- teams notification sent")
        sent = True

    if args.email_enabled:
        required = [args.smtp_host, args.email_from, args.email_to]
        if not all(required):
            raise RuntimeError("email-enabled requires smtp-host, email-from, email-to")
        smtp_password = os.environ.get("SMTP_PASSWORD", "")
        send_email(
            smtp_host=args.smtp_host,
            smtp_port=args.smtp_port,
            smtp_user=args.smtp_user,
            smtp_password=smtp_password,
            email_from=args.email_from,
            email_to=args.email_to,
            subject=f"{args.email_subject_prefix} {meta.get('pipelineVersion', '')}".strip(),
            body=text,
        )
        print("- email notification sent")
        sent = True

    if not sent:
        print("- no notification channel configured; skipping")


if __name__ == "__main__":
    main()
