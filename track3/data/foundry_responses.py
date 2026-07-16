#!/usr/bin/env python3
"""Call an Azure AI Foundry Responses API endpoint without persisting credentials."""

from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass
from typing import Any
from urllib import error as urlerror
from urllib import request as urlrequest


DEFAULT_SYSTEM_PROMPT = """당신은 Track3 FoundryIQ 리더십 브리핑 작성 에이전트입니다.
다음 고정 정책을 반드시 지키세요:
- Tool A(FabricIQ) 정형 수치를 우선 반영하고 Tool B(WorkIQ) 문서 근거를 결합합니다.
- 근거 링크가 없는 문장은 단정하지 말고 경고를 명시합니다.
- 출력은 다음 5개 섹션 형식을 고정합니다: 핵심요약, 수치근거, 문서근거, 조치안, 주의사항.
- 한국어로 작성하고, 임원이 1분 내로 읽을 수 있도록 간결하게 작성합니다."""


@dataclass(frozen=True)
class FoundryResponsesConfig:
    endpoint: str
    model: str
    api_key: str = ""
    bearer_token: str = ""
    timeout_sec: int = 60

    @classmethod
    def from_env(cls) -> "FoundryResponsesConfig":
        timeout_value = os.environ.get("AZURE_AI_FOUNDRY_TIMEOUT_SEC", "60").strip()
        try:
            timeout_sec = int(timeout_value)
        except ValueError as exc:
            raise RuntimeError("AZURE_AI_FOUNDRY_TIMEOUT_SEC must be an integer.") from exc
        if timeout_sec <= 0:
            raise RuntimeError("AZURE_AI_FOUNDRY_TIMEOUT_SEC must be greater than zero.")

        return cls(
            endpoint=os.environ.get("AZURE_AI_FOUNDRY_RESPONSES_ENDPOINT", "").strip(),
            model=os.environ.get("AZURE_AI_FOUNDRY_MODEL", "").strip(),
            api_key=os.environ.get("AZURE_AI_FOUNDRY_API_KEY", "").strip(),
            bearer_token=os.environ.get("AZURE_AI_FOUNDRY_BEARER_TOKEN", "").strip(),
            timeout_sec=timeout_sec,
        )

    @property
    def is_configured(self) -> bool:
        return bool(self.endpoint and self.model and (self.api_key or self.bearer_token))

    @property
    def auth_mode(self) -> str:
        if self.bearer_token:
            return "Bearer Token"
        if self.api_key:
            return "API Key"
        return "Not configured"

    def require_configured(self) -> None:
        if not self.endpoint:
            raise RuntimeError("AZURE_AI_FOUNDRY_RESPONSES_ENDPOINT is required.")
        if not self.model:
            raise RuntimeError("AZURE_AI_FOUNDRY_MODEL is required.")
        if not self.api_key and not self.bearer_token:
            raise RuntimeError(
                "Set AZURE_AI_FOUNDRY_API_KEY or AZURE_AI_FOUNDRY_BEARER_TOKEN."
            )

    def headers(self) -> dict[str, str]:
        self.require_configured()
        headers = {"Content-Type": "application/json; charset=utf-8"}
        if self.bearer_token:
            headers["Authorization"] = f"Bearer {self.bearer_token}"
        else:
            headers["api-key"] = self.api_key
        return headers


def extract_output_text(payload: dict[str, Any]) -> str:
    output_text = payload.get("output_text")
    if isinstance(output_text, str) and output_text.strip():
        return output_text.strip()

    fragments: list[str] = []
    for message in payload.get("output", []) or []:
        for part in message.get("content", []) or []:
            text = part.get("text")
            if isinstance(text, str) and text.strip():
                fragments.append(text.strip())
    return "\n".join(fragments)


def call_responses_api(
    *,
    config: FoundryResponsesConfig,
    system_prompt: str,
    user_prompt: str,
    max_output_tokens: int = 1400,
    retry_delays_sec: tuple[int, ...] = (5, 10, 20),
) -> dict[str, Any]:
    config.require_configured()
    if max_output_tokens <= 0:
        raise RuntimeError("max_output_tokens must be greater than zero.")

    request_body = {
        "model": config.model,
        "input": [
            {
                "role": "system",
                "content": [{"type": "input_text", "text": system_prompt}],
            },
            {
                "role": "user",
                "content": [{"type": "input_text", "text": user_prompt}],
            },
        ],
        "max_output_tokens": max_output_tokens,
    }
    body = json.dumps(request_body, ensure_ascii=False).encode("utf-8")
    request = urlrequest.Request(
        url=config.endpoint,
        data=body,
        headers=config.headers(),
        method="POST",
    )

    raw = ""
    for attempt in range(len(retry_delays_sec) + 1):
        try:
            with urlrequest.urlopen(request, timeout=config.timeout_sec) as response:
                raw = response.read().decode("utf-8")
            break
        except urlerror.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            is_transient = exc.code == 429 or exc.code >= 500
            if not is_transient or attempt == len(retry_delays_sec):
                raise RuntimeError(
                    f"Foundry Responses API returned HTTP {exc.code}: {detail}"
                ) from exc
        except urlerror.URLError as exc:
            if attempt == len(retry_delays_sec):
                raise RuntimeError(
                    f"Foundry Responses API connection failed: {exc}"
                ) from exc
        time.sleep(retry_delays_sec[attempt])

    if not raw.strip():
        raise RuntimeError("Foundry Responses API returned an empty response.")
    return json.loads(raw)


def generate_leadership_briefing(
    draft_markdown: str,
    *,
    config: FoundryResponsesConfig,
    system_prompt: str = DEFAULT_SYSTEM_PROMPT,
) -> str:
    user_prompt = (
        "아래는 Q1~Q3 통합 응답을 규칙 기반으로 결합한 리더십 브리핑 초안입니다. "
        "이 내용을 근거로 임원용 최종 브리핑을 작성하세요. 수치와 근거 링크는 초안에 있는 것만 사용하고, "
        "초안에 없는 내용을 지어내지 마세요.\n\n"
        f"---초안 시작---\n{draft_markdown}\n---초안 끝---"
    )
    payload = call_responses_api(
        config=config,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
    )
    output = extract_output_text(payload)
    if not output:
        raise RuntimeError("Responses API response did not contain output text.")
    return output
