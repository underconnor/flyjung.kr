# 구조와 변경 원칙

이 사이트는 콘텐츠 데이터와 정적 HTML 생성, 브라우저 동작을 분리한 작은 SSG다. 런타임 서버나 외부 스크립트가 필요하지 않다.

## 데이터가 페이지로 만들어지는 흐름

1. `site/data/`에서 공개 콘텐츠를 관리한다.
2. `site/pages/`가 콘텐츠를 공통 `escapeHTML`로 이스케이프해 페이지 본문으로 만든다.
3. `site/render.mjs`가 각 경로를 `site/layout.mjs`의 문서와 조합한다.
4. `scripts/build-site.mjs`가 페이지·자산·참조 경로를 검사하고 출력 디렉터리를 교체한다.
5. 브라우저는 공통 CSS 하나와 ES module을 읽는다. 기본 콘텐츠는 JavaScript 없이도 표시된다.

`site/`는 빌드 전용이다. `src/scripts/`는 브라우저 전용이다. 렌더러에서 DOM에 접근하거나 브라우저 코드에서 Node 파일 API를 사용하지 않는다.

## 바꿀 곳

| 변경 | 관리 위치 |
| --- | --- |
| 프로젝트·경력·글 내용 | `site/data/` |
| 페이지 구획과 콘텐츠 배치 | `site/pages/` |
| 헤더·푸터·검색 메타데이터 | `site/layout.mjs` |
| 배경·글꼴·공통 컨트롤 | `src/styles/base.css` |
| 페이지별 레이아웃 | `src/styles/{home,projects,blog,cv}.css` |
| 프로젝트 선택 상태 | `src/scripts/projects.js` |
| 블로그 분류·검색 이력 | `src/scripts/blog.js` |
| 서버의 블로그 분류 목록 | `site/data/blog.mjs`의 `blogCategories` |

블로그 브라우저 코드는 서버가 렌더링한 분류 버튼을 읽는다. 별도 분류 목록을 다시 선언하지 않는다. 본문은 문자열 문단으로 등록하며 HTML 문자열을 직접 삽입하지 않는다.

## 레이아웃

페이지 종류는 HTML의 `data-page`에 표시한다. `--canvas`와 `--ink`를 문서 루트에서 설정하고 body가 같은 값을 사용하므로 스크롤 경계에서도 배경이 이어진다. 짧은 페이지도 최소 화면 높이를 채운다. 내용 구획은 고정 높이로 잘라내지 않는다.

## 실행과 배포

미리보기는 127.0.0.1에만 바인딩하며 생성된 디렉터리만 제공한다. 소스·디렉터리 목록·심볼릭 링크는 제공하지 않는다. 없는 경로는 실제404 응답과 공통 오류 페이지로 표시한다.

공개 빌드는 경로별 canonical·sitemap·robots와 보안 헤더를 만든다. manifest와 ZIP은 `.runtime/deploy/`에 생성한다. 파일별 SHA256을 검사한 ZIP만 기존 Cloudflare Pages 프로젝트에 업로드한다. 운영 상태나 개인 정보가 담긴 로컬 기록은 공개 저장소에 넣지 않는다.
