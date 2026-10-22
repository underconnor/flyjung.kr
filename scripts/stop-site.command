#!/bin/zsh
set -eu
LABEL=com.flyjung.portfolio-site
if /bin/launchctl list "$LABEL" >/dev/null 2>&1; then
  /bin/launchctl remove "$LABEL"
  print '미리보기를 종료했습니다: http://127.0.0.1:4318/'
else
  print '실행 중인 관리 미리보기가 없습니다. npm run preview로 실행했다면 해당 터미널에서 Ctrl+C로 종료하세요.'
fi
