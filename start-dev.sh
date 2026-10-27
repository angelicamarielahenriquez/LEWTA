#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20.9 or newer is required."
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "Installing project dependencies (internet required for this first step)..."
  npm install
fi
npm run dev
