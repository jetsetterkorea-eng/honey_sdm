# 허니스드메 구글 시트 접수 연동

고객이 무료 견적 상담을 신청하면 Vercel 서버 함수가 입력을 확인하고 Google Sheets에 한 행을 기록합니다.

## 사용할 시트

[허니스드메 상담 접수](https://docs.google.com/spreadsheets/d/1TtZe4OQuqCU2Ll6ufl-BCEb7yDGz6yAzQx3V_bHxJ-s/edit)

2026년 11월 3일 jetsetterkorea@gmail.com으로 로그인된 내 드라이브에서 만들었으며, 공유 창에서 이 계정이 소유자임을 확인했습니다. `.env.example`에는 이 시트 ID가 들어 있습니다. 서비스 계정 인증정보와 개인정보 보유기간을 등록한 다음 운영 접수를 활성화합니다.

다시 연결할 시트에는 `상담접수` 탭의 A~W 열에 접수 시각, 상담 상태, 연락처, 여행·촬영 선택, 문의, 동의와 접수번호를 사용합니다. 담당자와 상담 메모는 운영자가 입력합니다. 헤더 이름·순서를 바꾸면 잘못된 열에 정보가 기록되지 않도록 접수를 중단합니다.

## 처음 한 번 연결하기

1. [Google Cloud](https://console.cloud.google.com/)에서 사용할 프로젝트를 선택하고 **Google Sheets API**를 사용 설정합니다.
2. **IAM 및 관리자 → 서비스 계정**에서 접수용 서비스 계정을 만듭니다. 프로젝트 전체 관리자 역할은 필요하지 않습니다. 서비스 계정의 **키 → 키 추가 → 새 키 만들기 → JSON**으로 인증 키를 받습니다.
3. 새로 사용할 구글 시트의 **공유**에서 서비스 계정 JSON의 `client_email`을 편집자로 추가합니다. 시트는 링크 공개로 바꿀 필요가 없습니다.
4. 이 폴더의 소스를 GitHub 저장소에 올립니다. `package.json`이 있는 폴더를 Vercel의 Root Directory로 지정하고 저장소를 연결합니다. Framework Preset은 **Other**, Build Command는 **npm run build**, Output Directory는 **dist**입니다. 설정은 `vercel.json`에도 들어 있습니다.
5. Vercel **Settings → Environment Variables**에 아래 값을 등록합니다. 키 파일은 GitHub에 올리지 않습니다.

| 이름 | 넣을 값 |
| --- | --- |
| `GOOGLE_SHEETS_ID` | `1TtZe4OQuqCU2Ll6ufl-BCEb7yDGz6yAzQx3V_bHxJ-s` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | 서비스 계정 JSON의 `client_email` |
| `GOOGLE_PRIVATE_KEY` | JSON의 `private_key`. BEGIN/END 줄을 포함한 키 문자열이며 실제 줄바꿈과 문자 `\n`을 모두 지원합니다. 바깥 따옴표는 넣지 않습니다. |
| `QUOTE_BUSINESS_NAME` | 개인정보를 수집하는 실제 운영 사업자명 |
| `QUOTE_PRIVACY_RETENTION` | 사업자가 정한 개인정보 보유·파기 기간 안내 문구 |
| `QUOTE_POLICY_VERSION` | 해당 동의 안내의 버전. 예를 들어 `2026-11-03-v1` |
| `QUOTE_ENABLED` | 위 설정과 시트 공유를 마친 뒤 `true` |

6. 다시 배포한 뒤 `/api/quotes`를 열어 `enabled: true`인지 확인합니다. 이 응답에는 인증 키와 시트 주소가 포함되지 않습니다.
7. 홈페이지에서 테스트임을 명확히 표시한 상담을 한 건 신청하고, 구글 시트에 한 행이 들어오는지 확인합니다. 안내 기간을 바꾸면 `QUOTE_POLICY_VERSION`도 변경합니다.

인증정보·보유기간이 비어 있거나 `QUOTE_ENABLED=false`이면 화면은 미리보기로 동작합니다. 현재 전달본에는 서비스 계정 인증 키가 없으므로 운영 접수는 활성화되어 있지 않습니다. 현재 ChatGPT Sites에 올라간 정적 미리보기와 이 Vercel 배포용 소스는 별도입니다.

Vercel Preview에도 실제 키와 `QUOTE_ENABLED=true`를 등록하면 같은 운영 시트로 접수됩니다. 개발용 배포에서는 `QUOTE_ENABLED=false`를 유지하거나 별도 시험 시트를 사용하세요.

## 파일

- `dist/`는 홈페이지와 고객이 보는 접수 상태입니다.
- `api/quotes.mjs`는 같은 도메인의 `GET /api/quotes`, `POST /api/quotes`를 처리합니다.
- `lib/quote-data.mjs`는 필수 입력·선택값 검증과 시트 행 구성을 담당합니다.
- `lib/sheets-store.mjs`는 Google 인증과 시트 기록을 담당합니다.
- `lib/quote-schema.mjs`, `docs/studio-source.json`은 열 순서와 서버가 확인하는 가격 기준입니다.
- `.env.example`은 필요한 환경변수 이름만 담고 있습니다.

가격·스튜디오·숙소를 수정할 때 화면과 서버의 기준 데이터도 함께 수정합니다. 서버는 브라우저가 보낸 가격을 사용하지 않고 기준 데이터로 다시 계산합니다. 추가 항목은 희망 조건으로 기록하며 결합 시작가에 자동 가산하지 않습니다.

## 접수 동작

미정인 항목이 있어도 이름·휴대폰 번호·개인정보 동의로 신청할 수 있습니다. 선택한 숙소와 스튜디오 세부 구성, 추가 항목, 희망 안내 방식, 기존 견적 비교 요청도 함께 전달합니다. 접수에 실패하면 내용을 유지하고 재시도를 안내합니다. 접수 성공 안내는 구글 시트 쓰기가 성공했을 때만 표시합니다.

동일 접수번호에 대한 재시도는 시트에 다시 추가하지 않습니다. 기록과 최근 접수번호 표식을 한 Sheets batchUpdate로 함께 반영하여 동시 요청과 응답 유실에 대응합니다. 최근 표식 200개를 유지하고 이전 접수번호는 U열에서 확인합니다. 시트에 직접 행을 삭제하면 과거 접수번호에 대한 확인도 사라집니다.

구글 인증정보는 서버에서만 사용합니다. 메모·이름을 수식이 아닌 문자열로 저장하고, 시트 전체 내용은 고객에게 반환하지 않습니다. 도메인 확인과 입력 검증은 기본 방어이며 대량 자동접수 차단이 필요한 운영 환경에서는 Vercel Firewall에 요청 제한을 설정하세요.

## 검증

```sh
npm ci
npm run build
npm test
```

테스트는 실제 구글 계정에 쓰지 않습니다. 테스트에서 동시 접수, 응답 유실 후 재시도, 잘못된 선택값, 동의 누락, 열 순서 변경과 가격 변조를 확인합니다. `test/preview-server.mjs`는 화면 확인용 로컬 가짜 API로 첫 신청은 실패, 다음 신청은 성공하도록 구성되어 있습니다.

기존 시트는 생성·헤더·형식 읽기까지만 확인했고, 운영 서비스 계정으로 실제 쓰는 검증과 Vercel 실배포는 진행하지 않았습니다. 현재 전달본에서는 기존 시트 연결 정보를 제거했습니다.

## 공식 문서

- [Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js)
- [Vercel 프로젝트 설정](https://vercel.com/docs/project-configuration/vercel-json)
- [Google 서비스 계정 인증](https://developers.google.com/identity/protocols/oauth2/service-account)
- [Google Sheets 일괄 쓰기](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/batchUpdate)
