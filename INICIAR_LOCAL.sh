#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  echo "Instala Node.js 22.18 o posterior y npm para abrir la web."
  exit 1
fi
if [ ! -d node_modules ]; then
  npm ci
fi
exec npm run dev -- --host 127.0.0.1 --port 5173 --open
