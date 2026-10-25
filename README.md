# flyjung.kr

[Figma](https://www.figma.com/design/I85IQjtzjZWsy8MVIMhdib?node-id=315-2)를 기준으로 만든 정적 포트폴리오입니다.
기존 디자인을 유지하는 본안과, 로컬에서만 비교하는 별도 실험안을 함께 관리합니다.

- 운영: https://flyjung.kr/
- Cloudflare Pages: https://flyjung-kr.pages.dev/
- Node.js 20 이상. ZIP 패키징에는 Python 3가 추가로 필요합니다.
- npm 의존성 설치, 데이터베이스, 프레임워크 없이 실행합니다.

## 블로그 쓰기

`scripts/write-blog.command`를 더블 클릭하거나 터미널에서 아래 명령을 실행합니다.

```sh
npm run write
```

http://127.0.0.1:4320/ 에서 제목·분류·본문을 입력하고 저장·미리보기할 수 있습니다. 초안은 이 컴퓨터에만 보관합니다. 공개할 글로 등록한 뒤 사이트를 빌드·배포하면 인터넷에 반영됩니다. 글쓰기 화면에서 저장하는 것만으로 공개 사이트가 바뀌지 않습니다.

자세한 과정은 [글쓰기 안내](docs/writing.md)를 참고하세요.

## 별도 디자인 시안

```sh
npm run concept
```

모든 시안은 상단 **시안 선택**에서 동등하게 비교합니다. [별자리](http://127.0.0.1:4321/)와 [787 ASCII](http://127.0.0.1:4321/terminal/)에서도 전체 메뉴를 열 수 있습니다.

| 경로 | 표현과 조작 |
| --- | --- |
| `/` | 깊은 밤하늘과 Canvas 별자리 |
| `/terminal/` | 프레임 없는 ASCII 787, 접을 수 있는 명령 입력 |
| `/horizon/` | 프로젝트·활동이 문자 별로 떠 있는 연결 그래프와 밝은 본문 |
| `/daybreak/` | 사각 패널 없이 페이지 전체로 펼쳐지는 밝은 새벽 하늘 |
| `/atmosphere/` | 심야 인디고에서 대기와 밝은 본문으로 이어지는 그라데이션 |
| `/descent/` | 787과 실제 저장소 커밋 별을 지나 스크롤로 내려오는 장면 |
| `/orbit/` | 짧은 하늘 도입부와 밝은 본문을 조합한 차분한 절충안 |
| `/flight-lab/` | 드래그·스크롤·포인터, 축·방식·감도·관성 비교 실험실 |
| `/hangar/`, `/indigo/`, `/flight/`, `/archive/` | 787 3D·Indigo·Flight·Cobalt 시안 |

이름을 주 제목으로 두고 **Somewhere between code and stars.**는 보조 문장으로 사용합니다. CV 아래에 고정 프로젝트 최대 두 개와 전체 검색 목록을 두며, Blog는 메인 메뉴에서 별도 페이지로 이동합니다. 실제 콘텐츠는 `site/data/`를 공유하고, 고정 프로젝트는 `experiments/catalog.mjs`의 `pinnedProjectIds`에서 지정합니다. 커밋 별은 `experiments/commit-records.mjs`에 검토한 실제 저장소 기록만 담습니다.

787은 공식 형상을 참고해 코드로 만든 스타일 모델입니다. `sky-engine`은 문자·입체 표현과 입력을 공유합니다. 실험실 설정은 URL로 복원하며 네이티브 페이지 스크롤을 유지합니다.

각 안은 `experiments/`에서 관리하며 `concept-dist/`에만 생성합니다. 공개 빌드와 배포 ZIP에는 포함하지 않습니다. 운영 사이트를 바꾸기 전에 이 경로에서 비교합니다.

## 시작하기

```sh
npm run check
npm run preview
```

http://127.0.0.1:4318/ 에서 확인합니다. 종료는 터미널에서 Ctrl+C입니다.

```sh
npm run check:public
npm run preview:public
npm run package:public
```

공개 미리보기는 http://127.0.0.1:4319/ 입니다. 마지막 명령은 검사한 `public-dist/`를 `.runtime/deploy/flyjung-public.zip`으로 묶습니다. 기존 미리보기 서버가 같은 포트를 쓰는 경우 중복 실행하지 않습니다.

macOS에서는 `scripts/start-site.command`와 `scripts/start-public.command`를 실행해 로그인 동안 미리보기를 유지할 수 있습니다. 각각 `scripts/stop-site.command`, `scripts/stop-public.command`로 종료합니다.

## 코드 구조

| 경로 | 역할 |
| --- | --- |
| `site/data/` | 프로젝트·CV·블로그 콘텐츠와 공개 데이터 검증 |
| `content/posts/` | 글쓰기 화면에서 공개용으로 등록한 글 |
| `site/pages/` | 페이지별 HTML 렌더러 |
| `site/layout.mjs` | 공통 문서·메타데이터·내비게이션·푸터 |
| `site/html.mjs` | HTML 이스케이프와 공통 경로 |
| `site/render.mjs` | 출력 URL과 페이지 조합 |
| `src/styles/` | 공통 토큰 및 페이지별 반응형 CSS |
| `src/scripts/` | 프로젝트 펼치기·블로그 검색과 URL 상태 |
| `src/assets/` | 공개 이미지·자체 호스팅 웹폰트·라이선스 |
| `scripts/` | 빌드·미리보기·테스트·ZIP 패키징 |
| `editor/` | 이 컴퓨터에서만 실행하는 글쓰기 화면 |
| `experiments/night/`, `experiments/terminal/`, `experiments/hangar/` | 밤하늘·터미널·3D 비교 시안 |
| `experiments/horizon/`, `experiments/daybreak/` | 이름 중심의 밝고 어두운 면을 조합한 새 절충안 |
| `experiments/atmosphere/`, `experiments/descent/`, `experiments/orbit/` | 그라데이션·스크롤 하강·열린 문자 별 시안 |
| `experiments/flight-lab/` | 비행기 입력 조합·모션·URL 설정 비교 |
| `experiments/navigation.*`, `experiments/commit-records.mjs` | 전체 시안 메뉴와 검토한 실제 커밋 스냅샷 |
| `experiments/aircraft-v2/`, `experiments/sky-engine/` | 새 787 지오메트리, 문자·입체 공유 렌더러와 입력 모션 |
| `experiments/catalog.mjs`, `experiments/aircraft/` | 공통 슬로건·고정 프로젝트, 공유 787 지오메트리 |
| `experiments/studio/`, `experiments/flight/` | 이전 인디고 타이포 안과 그림 시안 보관 |
| `experiments/bold/` | 이전 파랑 시안 보관 |
| `dist/`, `public-dist/` | 생성물. 직접 수정하거나 커밋하지 않음 |

소스 CSS는 페이지별로 나누고, 빌드에서 하나의 스타일시트로 합칩니다. 페이지 생성 → 공개 자산 검증 → 임시 출력 생성 → 기존 출력 교체 순서로 빌드합니다.

## 기능과 콘텐츠 수정

Home, `/projects/`, `/blog/`, `/cv/`는 각각 독립 URL입니다. 프로젝트는 해시 공유·새로고침·뒤로가기·키보드 조작을 지원합니다. 블로그는 분류·한글 검색·결과 없음·초기화·검색 이력 복원을 지원합니다.

블로그 글은 로컬 글쓰기 화면에서 관리합니다. `content/posts/`에 공개용으로 등록한 글만 목록과 상세 페이지로 생성됩니다. 공개 글은 고유한 slug, 분류, 실제 날짜, 제목, 본문이 필요하며 잘못된 데이터는 빌드에서 거부합니다. 시안의 예시 글은 발행하지 않았으므로 현재 게시글은 없습니다. 분류와 검증은 `site/data/blog.mjs`에서 관리합니다.

활동은 `site/data/cv.mjs`의 `activities`, 근무 경력은 `careers`, 수상은 `awards`로 나눕니다. 근무 경력이 등록되지 않은 경우 빈 경력 구획은 표시하지 않습니다.

현재 배포는 Cloudflare Pages Direct Upload 방식입니다. GitHub에 push하는 것만으로 자동 배포되지 않습니다. 검사를 통과한 ZIP을 기존 `flyjung-kr` 프로젝트에 업로드합니다. GitHub Actions 워크플로는 포함하지 않습니다.

## 공개 범위

원본 PDF·개인 검토 자료·로컬 운영 기록·비밀 설정은 Git과 공개 빌드에서 제외합니다. 빌드는 허용한 자산 종류만 복사하고 개인 자료 참조·심볼릭 링크·출력 경로 오류를 검사합니다. 저장소나 프로젝트 전체를 배포하지 말고 생성된 ZIP만 사용합니다.

Noto Sans KR의 OFL은 `src/assets/fonts/noto-OFL.txt`에 있습니다. [디자인 기준](docs/design-plan.md), [구조와 변경 원칙](docs/architecture.md), [점검 기록](docs/quality-review.md)을 참고하세요.
