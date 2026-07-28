#!/usr/bin/env python3
"""
Track1 샘플 데이터 결정론적 생성기 (v1.2)

목적
- WORKBOOK 미션1의 기준 질문 Q1~Q5가 "의미 있는 분석 신호"를 갖도록 데이터를 재구성.
- 동시에 미션2(프로파일링)/미션3(표준화)/미션5(검증)를 위한 의도적 노이즈와
  명명 상품 시나리오(재고부족→배송지연→CS)를 그대로 보존.

설계 원칙
- seed 고정으로 완전 재현 가능.
- 잠재변수(캠페인 실패성향 / 배송지연 / 품절포함 / 고객등급 재구매성향 / 프로모션 유형)에서
  자식 테이블(payments/shipments/returns/support_tickets/order_status 등)을 유도해 상관을 만든다.
- 정합 규칙 유지: net=gross-discount(R7), MultiTouch 귀속합=net(R8), order_value=net.
- 노이즈/명명 시나리오는 마지막에 "고정 ID"로 주입한다(Answer Key와 1:1 일치).

주입 신호(요약)
- Q1: 캠페인 fail_propensity(0.10~0.60) → 귀속 주문 결제실패율↑ ⇒ 전환율↓ (음의 상관)
- Q2: 지연 주문 반품률≈0.50 vs 비지연≈0.20 / 불만율 지연≈0.30 vs 비지연≈0.08
- Q3: 마진 Percent<BOGO<Amount<Bundle / 재구매 Bundle·BOGO 높고 Percent 낮음
- Q4: 품절 포함 주문 취소율≈0.20 vs 비품절≈0.03 / 주문당 문의 품절≈1.2 vs 0.4
- Q5: 재구매율 tier(Platinum>Gold>Silver>Bronze) 차등 + 채널/사유별 편차
"""

import csv
import os
import random
from datetime import datetime, timedelta

SEED = 20260701
rng = random.Random(SEED)
OUT = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------- helpers
def money(x):
    return f"{round(float(x) + 1e-9, 2):.2f}"

def d(dt):
    return dt.strftime("%Y-%m-%d")

def ts(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%S+09:00")

BASE = datetime(2026, 5, 1)

def write_csv(name, header, rows):
    path = os.path.join(OUT, name)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)
    print(f"  wrote {name}: {len(rows)} rows")

# ================================================================ MASTERS
# ---- channels (고정 4개)
channels = [
    ("CH0001", "OnlineMall"),
    ("CH0002", "MobileApp"),
    ("CH0003", "Social"),
    ("CH0004", "OfflineStore"),
]
channel_ids = [c[0] for c in channels]

# ---- customers (1200) : tier 300씩, 재구매 성향은 tier에서 유도
N_CUST = 1200
TIERS = ["Bronze", "Silver", "Gold", "Platinum"]
SEGMENTS = ["Loyal", "AtRisk", "New"]
REPEAT_PROP = {"Platinum": 0.85, "Gold": 0.70, "Silver": 0.50, "Bronze": 0.30}

customers = []
cust_tier = {}
for i in range(1, N_CUST + 1):
    cid = f"C{i:05d}"
    tier = TIERS[(i - 1) % 4]            # 균등 분포 (300/각)
    seg = SEGMENTS[(i - 1) % 3]
    join = datetime(2023, 1, 1) + timedelta(days=(i % 700))
    cust_tier[cid] = tier
    customers.append([cid, seg, tier, d(join)])

# ---- products (1200) : 6 카테고리, 명명 상품 고정
N_PROD = 1200
CATS = ["Electronics", "Fashion", "Home", "Sports", "Beauty", "Grocery"]
NAMED = {
    "P00001": ("UltraBook 15", "Electronics", 13.70),
    "P00005": ("AeroPhone X", "Electronics", 28.50),
    "P00006": ("SmartWatch Pro", "Electronics", 32.20),
}
products = []
prod_price = {}
prod_cat = {}
for i in range(1, N_PROD + 1):
    pid = f"P{i:05d}"
    if pid in NAMED:
        pname, cat, price = NAMED[pid]
    else:
        cat = CATS[(i - 1) % 6]
        pname = f"{cat} Item {i:05d}"
        price = round(rng.uniform(20, 900), 2)
    prod_price[pid] = price
    prod_cat[pid] = cat
    products.append([pid, pname, cat, money(price), "KRW"])

# ---- campaigns (1000) : fail_propensity 잠재변수 (Q1 신호원)
N_CAMP = 1000
CAMP_TYPES = ["Seasonal", "Acquisition", "Retention", "Flash"]
campaigns = []
camp_fail = {}          # campaign_id -> 결제 실패 성향(0.10~0.60)
for i in range(1, N_CAMP + 1):
    caid = f"CA{i:05d}"
    ctype = CAMP_TYPES[(i - 1) % 4]
    ch = channel_ids[(i - 1) % 4]
    start = datetime(2026, 4, 1) + timedelta(days=(i % 60))
    end = start + timedelta(days=30)
    # 캠페인별 결제 실패 성향을 넓게 분산 → Q1에서 캠페인 간 전환율 격차 발생
    camp_fail[caid] = round(rng.uniform(0.10, 0.60), 3)
    campaigns.append([caid, f"Campaign {i:05d} {ctype}", ctype, ch, d(start), d(end)])
camp_ids = [c[0] for c in campaigns]

# ---- promotions (1000) : 유형 250씩. 유형별 할인율(마진) 차등 (Q3 신호원)
N_PROMO = 1000
PROMO_TYPES = ["Amount", "Bundle", "BOGO", "Percent"]
# 유형별 gross 대비 할인 비율 목표: Percent 최대 → 마진 최저
PROMO_DISC_FRAC = {"Percent": 0.25, "BOGO": 0.15, "Amount": 0.10, "Bundle": 0.05}
promotions = []
promo_type = {}
for i in range(1, N_PROMO + 1):
    prid = f"PR{i:05d}"
    ptype = PROMO_TYPES[(i - 1) % 4]
    start = datetime(2026, 1, 1) + timedelta(days=(i % 120))
    end = start + timedelta(days=30)
    promo_type[prid] = ptype
    # discount_amount 컬럼은 프로모션 카탈로그상 표시값(참고). 실제 주문 할인은 유형 비율로 계산.
    disc = round(rng.uniform(5, 40), 2)
    promotions.append([prid, f"{ptype} Promo {i:05d}", ptype, money(disc), d(start), d(end)])
promo_ids = [p[0] for p in promotions]
promo_by_type = {t: [p for p in promo_ids if promo_type[p] == t] for t in PROMO_TYPES}

# ================================================================ ORDERS
# 고객별 주문 수: 기본 1건 + 잔여 800건을 tier 재구매성향 가중으로 배분 → 재구매율 신호
N_REG_ORDERS = 2000
order_customer = {}     # order_id -> customer_id
# 1) 모든 고객 1건
cust_order_count = {c[0]: 1 for c in customers}
# 2) 잔여 배분 (repeat 후보를 tier 가중으로 샘플, 고객당 최대 +2)
extra = N_REG_ORDERS - N_CUST  # 800
weighted_pool = []
for c in customers:
    cid = c[0]
    w = int(REPEAT_PROP[cust_tier[cid]] * 100)
    weighted_pool.extend([cid] * w)
rng.shuffle(weighted_pool)
added = 0
pi = 0
while added < extra and pi < len(weighted_pool):
    cid = weighted_pool[pi]
    pi += 1
    if cust_order_count[cid] < 3:
        cust_order_count[cid] += 1
        added += 1
# 혹시 부족하면 임의 보충
allc = [c[0] for c in customers]
while added < extra:
    cid = rng.choice(allc)
    if cust_order_count[cid] < 3:
        cust_order_count[cid] += 1
        added += 1

# 주문 ID 순차 부여 (고객 순회)
reg_order_ids = []
oidx = 0
for c in customers:
    cid = c[0]
    for _ in range(cust_order_count[cid]):
        oidx += 1
        oid = f"O{oidx:05d}"
        order_customer[oid] = cid
        reg_order_ids.append(oid)
assert oidx == N_REG_ORDERS, oidx

# 고객 total 주문수(명명주문 포함 전) → 재구매 판정용 later
# order 잠재변수 부여
order_rows = []
order_meta = {}   # oid -> dict(latents)
start_day_span = 59  # 2026-05-01 ~ 06-29

for idx, oid in enumerate(reg_order_ids):
    cid = order_customer[oid]
    ch = rng.choice(channel_ids)
    odate = BASE + timedelta(days=rng.randint(0, start_day_span))

    delayed = rng.random() < 0.334          # ~1/3 지연
    stockout = rng.random() < 0.166         # ~16.6% 품절 상품 포함

    # 프로모션: repeat 고객일수록 Bundle/BOGO, single 고객일수록 Percent 편향 (Q3 재구매 신호)
    is_repeat_customer = cust_order_count[cid] >= 2
    has_promo = rng.random() < 0.828        # ~1657/2000 주문에 프로모션
    ptype = None
    if has_promo:
        if is_repeat_customer:
            ptype = rng.choices(PROMO_TYPES, weights=[25, 35, 30, 10])[0]
        else:
            ptype = rng.choices(PROMO_TYPES, weights=[20, 10, 15, 55])[0]

    order_meta[oid] = dict(
        customer_id=cid, channel_id=ch, order_date=odate,
        delayed=delayed, stockout=stockout, ptype=ptype,
    )

# ---- order_items 생성 (품절 상품 포함 여부 반영) + gross 계산
STOCKOUT_PRODUCTS = set(f"P{n:05d}" for n in range(101, 201))  # 100개 품절군
non_stock_products = [f"P{n:05d}" for n in range(1, N_PROD + 1)
                      if f"P{n:05d}" not in STOCKOUT_PRODUCTS and f"P{n:05d}" != "P00050"]

order_items = []
order_gross = {}
for oid in reg_order_ids:
    m = order_meta[oid]
    n_items = rng.choices([1, 2, 3], weights=[33, 33, 34])[0]
    picks = []
    if m["stockout"]:
        picks.append(rng.choice(list(STOCKOUT_PRODUCTS)))
    while len(picks) < n_items:
        picks.append(rng.choice(non_stock_products))
    rng.shuffle(picks)
    gross = 0.0
    for pid in picks:
        qty = rng.randint(1, 3)
        sales = round(prod_price[pid] * qty, 2)
        gross += sales
        order_items.append([oid, pid, qty, money(sales)])
    order_gross[oid] = round(gross, 2)

# ---- 주문 금액/상태 + payments/shipments 유도
orders = []
payments = []
shipments = []
pay_i = 0
ship_i = 0
order_status_map = {}
order_net = {}

for oid in reg_order_ids:
    m = order_meta[oid]
    gross = order_gross[oid]
    # 할인: 프로모션 유형 비율 기반 (Q3 마진 신호)
    if m["ptype"]:
        frac = PROMO_DISC_FRAC[m["ptype"]] * rng.uniform(0.85, 1.15)
        discount = round(gross * frac, 2)
    else:
        discount = round(gross * rng.uniform(0.0, 0.03), 2)
    net = round(gross - discount, 2)
    order_net[oid] = net

    # 취소: 품절 포함 주문에서 취소율↑ (Q4 신호)
    cancel_p = 0.20 if m["stockout"] else 0.03
    cancelled = rng.random() < cancel_p
    status = "Cancelled" if cancelled else "Completed"
    order_status_map[oid] = status

    orders.append([oid, m["customer_id"], m["channel_id"], d(m["order_date"]),
                   status, money(gross), money(discount), money(net), money(net), "KRW"])

    # payment: 실패성향은 귀속 캠페인에서 later 설정. 여기선 placeholder, 아래에서 재설정.

# ---- campaign_attribution (1500 주문: 750 LastTouch + 750 MultiTouch)
# Q1 신호 가시성: 귀속을 소수의 "활성 캠페인 풀"에 집중시켜 캠페인당 표본을 충분히 확보.
#   (전체 1000개 캠페인에 흩뿌리면 캠페인당 1~2건이라 실패율/전환율이 0/1로 튀어 상관이 안 보임)
ACTIVE_CAMPAIGNS = camp_ids[:60]          # 활성 캠페인 60개 (각 fail_propensity 상이)
attributed = reg_order_ids[:1500]
lasttouch_orders = attributed[:750]
multitouch_orders = attributed[750:1500]
order_primary_campaign = {}   # oid -> campaign (결제 실패성향 결정)
campaign_attribution = []

for oid in lasttouch_orders:
    ca = rng.choice(ACTIVE_CAMPAIGNS)
    order_primary_campaign[oid] = ca
    campaign_attribution.append([ca, oid, order_customer[oid], "LastTouch",
                                 money(order_net[oid])])

for oid in multitouch_orders:
    net = order_net[oid]
    ca1, ca2 = rng.sample(ACTIVE_CAMPAIGNS, 2)
    order_primary_campaign[oid] = ca1  # 실패성향은 첫 캠페인 기준
    # net을 두 캠페인에 분할 (합 = net → R8 통과)
    r1 = round(net * rng.uniform(0.3, 0.7), 2)
    r2 = round(net - r1, 2)
    campaign_attribution.append([ca1, oid, order_customer[oid], "MultiTouch", money(r1)])
    campaign_attribution.append([ca2, oid, order_customer[oid], "MultiTouch", money(r2)])

# ---- payments (주문 1:1) : 귀속 캠페인 실패성향 반영 (Q1 신호)
for oid in reg_order_ids:
    m = order_meta[oid]
    ca = order_primary_campaign.get(oid)
    if ca is not None:
        fail_p = camp_fail[ca]
    else:
        fail_p = 0.30  # 비귀속 주문 기본 실패율
    r = rng.random()
    if r < fail_p:
        pstatus = "Failed"
        approved = 0.0
    else:
        # 승인군 내에서 Success / RetrySuccess 혼합 (표준화 토론 소재 유지)
        pstatus = "RetrySuccess" if rng.random() < 0.35 else "Success"
        approved = order_net[oid]
    pay_i += 1
    at = BASE + timedelta(minutes=pay_i * 7)
    payments.append([f"PAY{pay_i:05d}", oid, pstatus, money(approved), ts(at)])

# ---- shipments (주문 1:1) : delayed 잠재변수 반영 (Q2 신호)
for oid in reg_order_ids:
    m = order_meta[oid]
    if m["delayed"]:
        sstatus = "Delayed"
    else:
        sstatus = "Delivered" if rng.random() < 0.6 else "InTransit"
    ship_i += 1
    delivered = ts(m["order_date"] + timedelta(days=rng.randint(1, 6),
                                               hours=rng.randint(0, 12)))
    if sstatus == "InTransit":
        delivered = ""  # 배송중은 완료시각 없음
    shipments.append([f"SH{ship_i:05d}", oid, sstatus, delivered])

# ---- returns (delayed 주문에서 반품률↑) : 목표 1000 rows
# 반품 대상 주문 선택
returned_orders = []
for oid in reg_order_ids:
    m = order_meta[oid]
    if order_status_map[oid] == "Cancelled":
        continue  # 취소 주문은 반품 제외(자연스러움)
    ret_p = 0.50 if m["delayed"] else 0.20
    if rng.random() < ret_p:
        returned_orders.append(oid)

# 반품 사유: 채널/등급별 약간의 편차 부여 (Q5 다양성)
RETURN_REASONS = ["ChangedMind", "NotAsDescribed", "Damaged", "LateDelivery", "SizeIssue"]
returns = []
ret_i = 0
# 각 반품 주문에 1건 우선 배정
oi_by_order = {}
for row in order_items:
    oi_by_order.setdefault(row[0], []).append(row[1])

def make_return(oid):
    global ret_i
    m = order_meta[oid]
    ret_i += 1
    pid = rng.choice(oi_by_order.get(oid, [rng.choice(non_stock_products)]))
    if m["delayed"]:
        reason = rng.choices(RETURN_REASONS, weights=[15, 20, 20, 30, 15])[0]
    else:
        reason = rng.choices(RETURN_REASONS, weights=[30, 20, 15, 10, 25])[0]
    rdate = m["order_date"] + timedelta(days=rng.randint(3, 15))
    returns.append([f"R{ret_i:05d}", oid, pid, order_customer[oid], reason, d(rdate)])

for oid in returned_orders:
    make_return(oid)
# 잔여를 1000까지 다회 반품(멀티아이템 반품)으로 채움
while ret_i < 1000 and returned_orders:
    make_return(rng.choice(returned_orders))

# ---- support_tickets : delayed→Complaint, stockout→문의 증가 (Q2/Q4 신호)
TICKET_TYPES_OTHER = ["Shipping", "Inquiry", "Payment", "Return"]
TICKET_REASONS = {
    "Shipping": ["NoTrackingUpdate", "LateDelivery"],
    "Inquiry": ["GeneralQuestion"],
    "Payment": ["PaymentFailed"],
    "Return": ["SizeIssue", "NotAsDescribed"],
    "Complaint": ["LateDelivery", "NotAsDescribed"],
}
support_tickets = []
tk_i = 0

def add_ticket(oid, ttype):
    global tk_i
    m = order_meta[oid]
    tk_i += 1
    reason = rng.choice(TICKET_REASONS[ttype])
    at = ts(m["order_date"] + timedelta(days=rng.randint(0, 10), hours=rng.randint(0, 12)))
    support_tickets.append([f"T{tk_i:05d}", order_customer[oid], oid, ttype, reason, at])

for oid in reg_order_ids:
    m = order_meta[oid]
    # 불만 티켓: 지연 주문 0.30 / 비지연 0.08 (Q2)
    complaint_p = 0.30 if m["delayed"] else 0.08
    if rng.random() < complaint_p:
        add_ticket(oid, "Complaint")
    # 추가 문의: 품절 포함 주문에서 증가 (Q4 avg_tickets_per_order)
    base_lambda = 0.30 + (0.55 if m["stockout"] else 0.0) + (0.10 if m["delayed"] else 0.0)
    n_extra = 0
    if rng.random() < base_lambda:
        n_extra += 1
    if rng.random() < (base_lambda - 0.5 if base_lambda > 0.5 else 0):
        n_extra += 1
    for _ in range(n_extra):
        add_ticket(oid, rng.choice(TICKET_TYPES_OTHER))

# ---- order_promotions : ptype 배정된 주문에 실제 프로모션 연결 (일부 2건)
order_promotions = []
for oid in reg_order_ids:
    m = order_meta[oid]
    if m["ptype"]:
        pr = rng.choice(promo_by_type[m["ptype"]])
        order_promotions.append([oid, pr])
        # 약 14% 주문은 동일 유형 프로모션 2건 (현실적 중복)
        if rng.random() < 0.14:
            pr2 = rng.choice(promo_by_type[m["ptype"]])
            order_promotions.append([oid, pr2])

# ---- inventory_snapshots : 품절군은 on_hand<reserved, 그 외 여유 (Q4)
inventory_snapshots = []
snap_i = 0
for i in range(1, N_PROD + 1):
    pid = f"P{i:05d}"
    n_snap = rng.choices([1, 2, 3], weights=[33, 63, 4])[0]
    for _ in range(n_snap):
        snap_i += 1
        sdate = BASE + timedelta(days=rng.randint(0, 25))
        if pid in STOCKOUT_PRODUCTS:
            on_hand = rng.randint(0, 8)
            reserved = rng.randint(on_hand + 1, on_hand + 25)  # 부족
        else:
            reserved = rng.randint(0, 15)
            on_hand = rng.randint(reserved + 5, reserved + 60)  # 여유
        inventory_snapshots.append([f"S{snap_i:05d}", pid, d(sdate), on_hand, reserved])

# ================================================================ 명명 시나리오 주입 (고정)
# 명명 상품 재고: 2026-05-16, on_hand<reserved (재고부족)
def set_named_snapshot(sid, pid, on_hand, reserved):
    for row in inventory_snapshots:
        if row[0] == sid:
            row[1], row[2], row[3], row[4] = pid, "2026-05-16", on_hand, reserved
            return
    inventory_snapshots.append([sid, pid, "2026-05-16", on_hand, reserved])

# 명명 주문 3건 추가 (O09001-3) — 소액, 명명 상품 1종씩
named_orders = [
    ("O09001", "C00010", "CH0002", "2026-05-16", "P00005", 2),
    ("O09002", "C00003", "CH0003", "2026-05-16", "P00006", 1),
    ("O09003", "C00008", "CH0001", "2026-05-17", "P00001", 1),
]
for oid, cid, ch, odate, pid, qty in named_orders:
    sales = round(prod_price[pid] * qty, 2)
    gross = sales
    orders.append([oid, cid, ch, odate, "Completed", money(gross), "0.00",
                   money(gross), money(gross), "KRW"])
    order_items.append([oid, pid, qty, money(sales)])
    order_customer[oid] = cid
    order_meta[oid] = dict(customer_id=cid, channel_id=ch,
                           order_date=datetime.strptime(odate, "%Y-%m-%d"),
                           delayed=True, stockout=True, ptype=None)

# 명명 재고 스냅샷 (기존 3개 슬롯 재사용/보정)
set_named_snapshot("S09001", "P00005", 4, 30)
set_named_snapshot("S09002", "P00006", 3, 25)
set_named_snapshot("S09003", "P00001", 6, 40)

# 명명 배송/티켓 (고정)
shipments.append(["SH09001", "O09001", "Delayed", "2026-05-22T20:00:00+09:00"])
shipments.append(["SH09002", "O09002", "Delayed", "2026-05-23T19:30:00+09:00"])
shipments.append(["SH09003", "O09003", "InTransit", ""])
support_tickets.append(["T09001", "C00010", "O09001", "Shipping", "NoTrackingUpdate", "2026-05-20T09:15:00+09:00"])
support_tickets.append(["T09002", "C00003", "O09002", "Complaint", "LateDelivery", "2026-05-21T14:40:00+09:00"])
support_tickets.append(["T09003", "C00008", "O09003", "Shipping", "NoTrackingUpdate", "2026-05-19T16:05:00+09:00"])
# 명명 주문 결제(정상 승인)
pay_i += 1
payments.append([f"PAY{pay_i:05d}", "O09001", "Success", money(prod_price["P00005"] * 2), "2026-05-16T10:00:00+09:00"])
pay_i += 1
payments.append([f"PAY{pay_i:05d}", "O09002", "Success", money(prod_price["P00006"]), "2026-05-16T10:05:00+09:00"])
pay_i += 1
payments.append([f"PAY{pay_i:05d}", "O09003", "Success", money(prod_price["P00001"]), "2026-05-17T10:10:00+09:00"])

# ================================================================ 노이즈 주입 (Answer Key 1:1)
def find(rows, idx, val):
    for r in rows:
        if r[idx] == val:
            return r
    return None

# R3 NULL — 빈 문자열로 표기
_c = find(customers, 0, "C00007");            _c[1] = ""      # customer_segment
_o = find(orders, 0, "O00013");               _o[3] = ""      # order_date
_p = find(payments, 0, "PAY00019");           _p[2] = ""      # payment_status
_r = find(returns, 0, "R00011")
if _r is None:
    returns.append(["R00011", "O00022", "P00055", "C00022", "", "2026-05-19"])
else:
    _r[4] = ""                                                # return_reason
_t = find(support_tickets, 0, "T00005")
if _t is None:
    support_tickets.append(["T00005", "C00015", "O00015", "Complaint", "", "2026-05-01T09:35:00+09:00"])
else:
    _t[4] = ""                                                # ticket_reason

# R4 이상값
_pp = find(products, 0, "P00050");            _pp[3] = "0.00"          # unit_price 0
_pr = find(promotions, 0, "PR00050")
if _pr:
    _pr[1], _pr[2], _pr[3] = "INVALID Test Promo", "Bundle", "-5.00"   # 음수 할인
_si = find(inventory_snapshots, 0, "S00050")
if _si:
    _si[1], _si[3], _si[4] = "P00050", -3, 25                          # 음수 재고
# O00033 음수 수량 아이템 (gross=net 정합 유지, 이상값만)
orders_o33 = find(orders, 0, "O00033")
if orders_o33:
    orders_o33[5] = "-864.70"; orders_o33[6] = "-864.70"; orders_o33[7] = "0.00"; orders_o33[8] = "0.00"
order_items = [r for r in order_items if r[0] != "O00033"]
order_items.append(["O00033", "P00231", -1, "-864.70"])

# R6 금액 정합성 불일치 (gross vs SUM(items)); net=gross-discount(R7)은 유지
def sum_items(oid):
    return round(sum(float(r[3]) for r in order_items if r[0] == oid), 2)

for oid, delta in (("O00007", 10.0), ("O00600", -25.0)):
    orow = find(orders, 0, oid)
    if orow:
        s = sum_items(oid)
        new_gross = round(s + delta, 2)
        disc = float(orow[6])
        new_net = round(new_gross - disc, 2)
        orow[5] = money(new_gross)
        orow[7] = money(new_net)
        orow[8] = money(new_net)

# R1 참조 무결성 오류 (고아 FK)
payments.append(["PAY90001", "O99999", "Success", "100.00", "2026-05-02T10:00:00+09:00"])
support_tickets.append(["T90001", "C99999", "O00001", "Inquiry", "GeneralQuestion", "2026-05-02T09:00:00+09:00"])

# R2 PK 중복 (shipments SH00001 2회)
shipments.append(["SH00001", "O00002", "Delivered", "2026-05-04T09:00:00+09:00"])

# ================================================================ 행수 정합 (문서 값에 맞춤)
# payments 문서값 2004: 현재 = 2000(reg)+3(named)+1(PAY90001)=2004 ✓
# shipments 문서값 2004: 2000+3(named)+1(dup)=2004 ✓
# order_items 문서값 4004: 가변 → 문서 갱신 예정
# returns 1000 정확
# support_tickets 문서값 1204: 가변 → 문서 갱신 예정
# campaign_attribution 2250: 750+750*2=2250 ✓
# inventory 2003: 가변 → 문서 갱신 예정
# order_promotions 1885: 가변 → 문서 갱신 예정

# ================================================================ WRITE
print("Writing CSVs...")
write_csv("channels.csv", ["channel_id", "channel_name"], channels)
write_csv("customers.csv", ["customer_id", "customer_segment", "customer_tier", "join_date"], customers)
write_csv("products.csv", ["product_id", "product_name", "category", "unit_price", "currency"], products)
write_csv("campaigns.csv", ["campaign_id", "campaign_name", "campaign_type", "channel_id", "start_date", "end_date"], campaigns)
write_csv("promotions.csv", ["promotion_id", "promotion_name", "promotion_type", "discount_amount", "start_date", "end_date"], promotions)
write_csv("orders.csv", ["order_id", "customer_id", "channel_id", "order_date", "order_status", "gross_amount", "discount_applied", "net_amount", "order_value", "currency"], orders)
write_csv("order_items.csv", ["order_id", "product_id", "quantity", "sales_amount"], order_items)
write_csv("payments.csv", ["payment_id", "order_id", "payment_status", "approved_amount", "approved_at"], payments)
write_csv("shipments.csv", ["shipment_id", "order_id", "shipment_status", "delivered_at"], shipments)
write_csv("returns.csv", ["return_id", "order_id", "product_id", "customer_id", "return_reason", "return_date"], returns)
write_csv("inventory_snapshots.csv", ["snapshot_id", "product_id", "snapshot_date", "on_hand_qty", "reserved_qty"], inventory_snapshots)
write_csv("order_promotions.csv", ["order_id", "promotion_id"], order_promotions)
write_csv("campaign_attribution.csv", ["campaign_id", "order_id", "customer_id", "attribution_model", "attributed_revenue"], campaign_attribution)
write_csv("support_tickets.csv", ["ticket_id", "customer_id", "order_id", "ticket_type", "ticket_reason", "created_at"], support_tickets)

print("\nRow counts:")
for n, rows in [("orders", orders), ("order_items", order_items), ("payments", payments),
                ("shipments", shipments), ("returns", returns),
                ("inventory_snapshots", inventory_snapshots),
                ("order_promotions", order_promotions),
                ("campaign_attribution", campaign_attribution),
                ("support_tickets", support_tickets)]:
    print(f"  {n}: {len(rows)}")
print("Done.")
