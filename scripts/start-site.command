#!/bin/zsh
set -eu
SITE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LABEL=com.flyjung.portfolio-site
if /bin/launchctl list "$LABEL" >/dev/null 2>&1; then
  print '사이트 미리보기가 이미 실행 중입니다: http://127.0.0.1:4318/'
  exit 0
fi
if /usr/sbin/lsof -nP -iTCP:4318 -sTCP:LISTEN >/dev/null 2>&1; then
  print -u2 '4318 포트를 다른 프로세스가 사용 중입니다. 종료하지 않았습니다.'
  exit 1
fi
if [[ ! -f "$SITE_ROOT/dist/index.html" ]]; then
  print -u2 '먼저 npm run check로 사이트를 빌드해 주세요.'
  exit 1
fi
mkdir -p "$SITE_ROOT/.runtime"
NODE_BIN="$(command -v node || true)"
if [[ -z "$NODE_BIN" ]]; then
  print -u2 'Node.js 20 이상을 설치한 뒤 다시 실행해 주세요.'
  exit 1
fi
/bin/launchctl submit -l "$LABEL" -o "$SITE_ROOT/.runtime/server.stdout.log" -e "$SITE_ROOT/.runtime/server.stderr.log" -- "$NODE_BIN" "$SITE_ROOT/scripts/preview.mjs"
print '포트폴리오 사이트: http://127.0.0.1:4318/'
print '이번 로그인 동안 유지합니다. 종료: scripts/stop-site.command'
