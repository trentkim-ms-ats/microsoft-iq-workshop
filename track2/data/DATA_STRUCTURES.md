# Track2 샘플 데이터 구조 요약

이 문서는 [generate_samples.js](generate_samples.js)로 생성되는 Track2 샘플 데이터의 핵심 구조를 빠르게 확인하기 위한 요약입니다.

## 1) 공통 카탈로그

- 파일: `generated/manifests/content_manifest.csv`
- 목적: 소스별 콘텐츠 메타데이터 단일 인덱스
- 주요 컬럼:
  - `id`: 콘텐츠 식별자 (예: `SP01`, `EM10`, `TM15`)
  - `source`: `SharePoint` / `Outlook` / `Teams` / `OneDrive`
  - `title`: 문서/메시지 제목
  - `businessDate`: 업무 기준 시각(샘플 시나리오 시간)
  - `location`: 로컬 생성 파일 경로
  - `target`: M365 업로드/게시 대상 경로
  - `keywords`: 검색 키워드(세미콜론 구분)
  - `acl`: 의도된 접근 그룹 라벨
  - `status`: `Final`, `Draft`, `Restricted` 등 상태값
  - `qualityFlags`: 의도된 품질 사례 플래그

## 2) 소스별 원본 데이터

### SharePoint
- 폴더: `generated/sharepoint/`
- 형식: `.docx` 문서
- 매핑: `content_manifest.csv`의 `SP*` 행

### OneDrive
- 폴더: `generated/onedrive/`
- 형식: `.docx` 문서
- 매핑: `content_manifest.csv`의 `OD*` 행

### Outlook
- 폴더: `generated/outlook/`
- 형식: `.eml` + 배포용 JSON
- 매핑: `content_manifest.csv`의 `EM*` 행

### Teams
- 폴더: `generated/teams/`
- 형식: 스레드/메시지 JSON
- 매핑: `content_manifest.csv`의 `TM*` 행

## 3) 배포 설정 데이터

- 템플릿: `deployment_config.example.json`
- 런타임: `deployment_config.json` (gitignore)
- 포함 정보:
  - SharePoint `siteId`, `driveId`
  - OneDrive `userId`
  - Outlook 발신/수신자 역할 매핑
  - Teams `teamId`, 채널별 `channelId`

## 4) 미션2 교차 매핑 입력 구조

[verify_entity_document_mapping.py](verify_entity_document_mapping.py) 기준 매핑 CSV 필수 컬럼:

- `엔터티 유형`
- `엔터티 값`
- `매칭 문서 제목`
- `소스`
- `문서 링크/ID`
- `매칭 상태`
- `비고`

이 매핑 파일을 사용해 실습지 미션2 조건(엔터티 커버리지/핵심 상품/정규화 사례)을 자동 검증합니다.
