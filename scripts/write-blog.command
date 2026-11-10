#!/bin/zsh
set -eu
WRITING_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$WRITING_ROOT"
if ! command -v node >/dev/null 2>&1; then
  print -u2 'Node.js 20 이상을 설치한 뒤 다시 실행해 주세요.'
  exit 1
fi
print '글쓰기 화면: http://127.0.0.1:4320/'
print '이 창을 열어 두세요. 종료하려면 Ctrl+C를 누르세요.'
exec node scripts/editor.mjs
