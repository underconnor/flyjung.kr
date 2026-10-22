# flyjung.kr

[Figma](https://www.figma.com/design/I85IQjtzjZWsy8MVIMhdib?node-id=315-2)를 기준으로 만든 정적 포트폴리오입니다.

- 운영: https://flyjung.kr/
- Cloudflare Pages: https://flyjung-kr.pages.dev/
- Node.js 20 이상. ZIP 패키징에는 Python 3가 추가로 필요합니다.
- npm 의존성 설치, 데이터베이스, 프레임워크 없이 실행합니다.

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
| `site/pages/` | 페이지별 HTML 렌더러 |
| `site/layout.mjs` | 공통 문서·메타데이터·내비게이션·푸터 |
| `site/html.mjs` | HTML 이스케이프와 공통 경로 |
| `site/render.mjs` | 출력 URL과 페이지 조합 |
| `src/styles/` | 공통 토큰 및 페이지별 반응형 CSS |
| `src/scripts/` | 프로젝트 펼치기·블로그 검색과 URL 상태 |
| `src/assets/` | 공개 이미지·자체 호스팅 웹폰트·라이선스 |
| `scripts/` | 빌드·미리보기·테스트·ZIP 패키징 |
| `dist/`, `public-dist/` | 생성물. 직접 수정하거나 커밋하지 않음 |

소스 CSS는 페이지별로 나누고, 빌드에서 하나의 스타일시트로 합칩니다. 페이지 생성 → 공개 자산 검증 → 임시 출력 생성 → 기존 출력 교체 순서로 빌드합니다.

## 기능과 콘텐츠 수정

Home, `/projects/`, `/blog/`, `/cv/`는 각각 독립 URL입니다. 프로젝트는 해시 공유·새로고침·뒤로가기·키보드 조작을 지원합니다. 블로그는 분류·한글 검색·결과 없음·초기화·검색 이력 복원을 지원합니다.

블로그 글은 `site/data/blog.mjs`에 등록합니다. `status: 'published'`인 글만 목록과 상세 페이지로 생성됩니다. 공개 글은 고유한 slug, 분류, 실제 날짜, 제목, 본문이 필요하며 잘못된 데이터는 빌드에서 거부합니다. 시안의 예시 글은 발행하지 않았으므로 현재 게시글은 없습니다. 분류는 `blogCategories` 한 곳에서 관리합니다.

현재 배포는 Cloudflare Pages Direct Upload 방식입니다. GitHub에 push하는 것만으로 자동 배포되지 않습니다. 검사를 통과한 ZIP을 기존 `flyjung-kr` 프로젝트에 업로드합니다. GitHub Actions 워크플로는 포함하지 않습니다.

## 공개 범위

원본 PDF·개인 검토 자료·로컬 운영 기록·비밀 설정은 Git과 공개 빌드에서 제외합니다. 빌드는 허용한 자산 종류만 복사하고 개인 자료 참조·심볼릭 링크·출력 경로 오류를 검사합니다. 저장소나 프로젝트 전체를 배포하지 말고 생성된 ZIP만 사용합니다.

Noto Sans KR의 OFL은 `src/assets/fonts/noto-OFL.txt`에 있습니다. [디자인 기준](docs/design-plan.md), [구조와 변경 원칙](docs/architecture.md), [점검 기록](docs/quality-review.md)을 참고하세요.
