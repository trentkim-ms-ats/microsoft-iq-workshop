#!/usr/bin/env python3
"""
배포된 메일 발송/수신 검증 스크립트
각 사용자의 위임 토큰으로 자신의 메일함 조회
"""
import json, urllib.request, urllib.error, os, sys

cfg = json.load(open("deployment_config.json"))
ADMIN = os.environ.get("ADMIN_TOKEN", "")

if not ADMIN:
    print("❌ ADMIN_TOKEN 환경변수 필수 (Mail.Read.All 권한 필요)")
    sys.exit(1)

BASE = "https://graph.microsoft.com/v1.0"
senders = cfg["outlook"]["senders"]

# 각 발신자별 메일 개수 통계
print("=== 배포된 메일 검증 ===\n")
print("각 사용자의 Sent Items 확인:\n")

for role, sender_email in senders.items():
    sender_enc = urllib.parse.quote(sender_email, safe="")
    
    try:
        # Sent Items 폴더 조회
        with urllib.request.urlopen(
            urllib.request.Request(
                f"{BASE}/users/{sender_enc}/mailFolders/sentItems/messages?$select=subject,from,toRecipients,receivedDateTime&$top=50",
                headers={"Authorization": f"Bearer {ADMIN}", "Accept": "application/json"}
            ),
            timeout=60
        ) as resp:
            data = json.loads(resp.read())
            sent_count = len(data.get("value", []))
            
            # Track2 커스텀 헤더가 있는 메일 필터
            track2_mails = [m for m in data.get("value", []) if "Track2" in m.get("subject", "")]
            
            print(f"  {role:12} ({sender_email})")
            print(f"    Sent Items: {sent_count}개 (Track2: {len(track2_mails)}개)")
            
            if track2_mails:
                for m in track2_mails[:3]:
                    print(f"      - {m.get('subject', '(No Subject)')[:60]}")
            print()
            
    except urllib.error.HTTPError as e:
        print(f"  {role:12} - ❌ HTTP {e.code}")
        print()

# 수신자별 수신 메일 확인
print("\n각 사용자의 Inbox 확인:\n")

recipients = cfg["outlook"]["recipients"]
for role, recipient_email in recipients.items():
    recipient_enc = urllib.parse.quote(recipient_email, safe="")
    
    try:
        with urllib.request.urlopen(
            urllib.request.Request(
                f"{BASE}/users/{recipient_enc}/mailFolders/inbox/messages?$select=subject,from,receivedDateTime&$top=50",
                headers={"Authorization": f"Bearer {ADMIN}", "Accept": "application/json"}
            ),
            timeout=60
        ) as resp:
            data = json.loads(resp.read())
            inbox_count = len(data.get("value", []))
            
            # Track2 메일 필터
            track2_mails = [m for m in data.get("value", []) if "Track2" in m.get("subject", "") or any(k in m.get("from", {}).get("emailAddress", {}).get("address", "") for k in senders.values())]
            
            print(f"  {role:12} ({recipient_email})")
            print(f"    Inbox: {inbox_count}개 (Track2: {len(track2_mails)}개)")
            
            if track2_mails:
                for m in track2_mails[:2]:
                    print(f"      - {m.get('subject', '(No Subject)')[:60]}")
            print()
            
    except urllib.error.HTTPError as e:
        print(f"  {role:12} - ❌ HTTP {e.code}")
        print()

print("\n✓ 검증 완료")
