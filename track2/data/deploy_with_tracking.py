#!/usr/bin/env python3
"""
배포된 메일의 메시지 ID를 기록하여 추적 가능하게
"""
import json, urllib.request, urllib.error, urllib.parse, os, sys

cfg = json.load(open("deployment_config.json"))
APP = os.environ.get("GRAPH_ACCESS_TOKEN", "")

if not APP:
    print("❌ GRAPH_ACCESS_TOKEN 환경변수 필수")
    sys.exit(1)

BASE = "https://graph.microsoft.com/v1.0"
senders = cfg["outlook"]["senders"]
recipients = cfg["outlook"]["recipients"]

# 배포 로그 파일
log_file = open("email_deployment.log", "w")

def send_mail(sender_email, subject, to_emails):
    """메일 발송 후 메시지 ID 반환"""
    payload = {
        "message": {
            "subject": subject,
            "body": {"contentType": "HTML", "content": "<p>Track2 Test</p>"},
            "toRecipients": [{"emailAddress": {"address": e}} for e in to_emails],
            "internetMessageHeaders": [
                {"name": "X-Track2-Sample", "value": "true"},
                {"name": "X-Track2-Deployed", "value": "true"}
            ]
        },
        "saveToSentItems": True
    }
    
    sender_enc = urllib.parse.quote(sender_email, safe="")
    try:
        req = urllib.request.Request(
            f"{BASE}/users/{sender_enc}/sendMail",
            data=json.dumps(payload).encode(),
            method="POST",
            headers={
                "Authorization": f"Bearer {APP}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        )
        with urllib.request.urlopen(req, timeout=90) as resp:
            status = resp.status
            # HTTP 202는 메시지 ID를 반환하지 않음 (async 작업)
            # 하지만 saveToSentItems=True이면 Sent Items에 저장됨
            return status, None
    except urllib.error.HTTPError as e:
        return e.code, str(e)

print("=== Track2 메일 배포 추적 ===\n")
print(f"발신자: {list(senders.keys())}\n")

# 테스트: CEO에서 CFO로 메일 발송
status, msg_id = send_mail(senders["ceo"], "[Track2 Test] CEO to CFO", [recipients["cfo"]])

if status == 202:
    print(f"✓ CEO → CFO 메일 발송 성공 (HTTP 202)")
    print(f"  발신: {senders['ceo']}")
    print(f"  수신: {recipients['cfo']}")
    print(f"  제목: [Track2 Test] CEO to CFO")
    print(f"  상태: Sent Items에 저장 예정\n")
    log_file.write(f"CEO→CFO,{senders['ceo']},{recipients['cfo']},202,success\n")
else:
    print(f"❌ HTTP {status}: {msg_id}\n")
    log_file.write(f"CEO→CFO,{senders['ceo']},{recipients['cfo']},{status},failed\n")

log_file.close()
print("✓ 로그 파일: email_deployment.log")
