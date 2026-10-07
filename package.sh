#!/bin/sh
set -eu
cd "$(dirname "$0")"
node scripts/build.js
version=$(node -p "require('./manifest.json').version")
for browser in chrome firefox; do
  (cd "bin/$browser" && zip -q -r "../steam-context-menu-$browser-$version.zip" .)
done
