# Figma 구현 기준
기준 파일: https://www.figma.com/design/I85IQjtzjZWsy8MVIMhdib?node-id=315-2
페이지: v1 UI. 사용자 요청에 따라 기존 CSS 장식 패널을 제거하고 실제 Figma 화면 및 이미지로 교체했습니다.

## 적용한 화면
- Home Desktop `370:719`, Mobile `370:836` (최신 201 기반 홈)
- Projects 1안 기본 `325:182`, 신성인 `325:214`, 모무 `325:262`
- Projects Mobile `328:1492`, `328:1524`, `328:1571`
- Blog 1안 `327:224`, Empty `327:324`, Mobile `328:1618`
- CV 1안 `327:272`, Mobile `328:1666`

같은 캔버스의 2안 및 ‘기준 원본’ 홈은 비교 시안입니다. 최신 홈의 텍스트 내비게이션과 연결되는 1안으로 일관되게 구현했습니다. 모바일도 Projects/Blog/CV 링크를 그대로 표시합니다.

## 구현
Figma의 React/Tailwind 참고 코드는 기존 Node 정적 빌드에 맞춰 HTML·CSS·ES module로 옮겼습니다. 디자인과 상관없는 프레임워크 의존성은 추가하지 않았습니다. 공통 데이터, 공통 레이아웃, 페이지 템플릿, 브라우저 동작, 스타일을 분리했습니다.

페이지 배경은 Home #f7f6f2, 하위 페이지 #fcfcfa입니다. 하위 페이지 본문 폭1120px, Home1248px, 모바일 여백24px를 적용했습니다. 좁은 화면320px도 지원하며, 중간 화면에서는 자연스럽게 축소·재배치합니다.

## 실제 자산
Figma get_design_context가 반환한 PNG4개를 내려받아 `src/assets/projects/`에 저장했습니다. 신성인 급식·한줄평, 모무 미션·피드 이미지를 지정 슬롯에 배치하며 임시 Figma URL을 런타임에 사용하지 않습니다. 원본 전체 화면 렌더를 페이지 배경으로 사용하지 않았습니다.

Noto Sans KR 가변400–700을 Google Fonts 공식 v40 WOFF2로 자체 호스팅합니다.
- https://fonts.google.com/noto/specimen/Noto+Sans+KR
- https://github.com/google/fonts/tree/main/ofl/notosanskr
Unicode 범위별 파일은 필요한 문자만 다운로드하며, OFL은 `src/assets/fonts/noto-OFL.txt`에 보존합니다.

## 공개 콘텐츠
현재 Figma에서 확인한 프로젝트·CV 정보를 사용합니다. Figma의 ‘예시 콘텐츠’ 블로그 행은 실제 게시글로 발행하지 않았으며, 빈 상태가 현재 운영 데이터입니다. 실제 글을 등록하면 검색·필터·목록과 상세 페이지가 함께 활성화됩니다. 기존 비공개 원본 PDF·검토/연구 문서는 모든 빌드에서 제외합니다.

## 확인 근거
Figma 컨텍스트는 `.runtime/figma/`, 실제 Chrome 데스크톱·모바일 스크린샷은 `output/playwright/figma/`에 로컬로 보존합니다. 원래 코드는 `.runtime/backups/before-figma-refactor.tar.gz`에 보관했습니다.

## 별도 비교 시안 — 2026-10-23

사용자의 후속 요청에 따라 기존 안은 유지하고 `experiments/bold/`에 과감한 비교 시안을 따로 만들었습니다. 본안의 수정은 활동·수상 구분과 블로그 빈 상태 문구에 한정합니다. 확인된 근무 이력이 없어 경력은 별도 데이터 목록으로만 준비하고 빈 구획은 표시하지 않습니다.

비교 시안은 코발트색 첫 화면, 큰 영문 타이포, 실제 신성인·모무 화면을 중심으로 구성합니다. 세 가지 영어 슬로건은 확정 전 가안이며 화면에서 직접 바꿔 볼 수 있습니다. 화면 폭이 좁아지면 프로젝트 본문과 이미지, 활동 목록이 세로로 재배치됩니다. 자세한 색상·구성 기준은 `experiments/bold/README.md`에 기록합니다.

이 시안은 전용 `concept-dist/`에만 빌드하고 로컬 4321 포트에서 비교합니다. 글쓰기 화면은 별도 로컬 4320 포트에서 실행합니다. 둘 다 기존 공개 빌드와 배포 ZIP에서 제외하며, 이번 비교 작업으로 운영 사이트를 변경하지 않습니다.
