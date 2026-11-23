#!/bin/sh
# Vercel install for the npm-workspaces monorepo (apps/web is the Vercel root directory).
# Finds the workspace root, installs all workspaces incl. dev tools (TypeScript for `next build`),
# and logs where it runs so a failing build can be diagnosed from the Vercel log alone.
set -eu
echo "[familyos-install] cwd=$PWD"
d=$PWD
while [ "$d" != "/" ]; do
  if [ -f "$d/package.json" ] && grep -q '"workspaces"' "$d/package.json"; then break; fi
  d=$(dirname "$d")
done
if [ "$d" = "/" ]; then
  echo "[familyos-install] no workspace root above $PWD. Contents:"; ls -la "$PWD"
  echo "[familyos-install] Vercel: enable 'Include files outside the root directory in the Build Step'."
  exit 1
fi
echo "[familyos-install] workspace root=$d"
ls -la "$d"
cd "$d"
if [ -f package-lock.json ]; then
  npm ci --include=dev --no-audit --no-fund
else
  echo "[familyos-install] package-lock.json missing here, falling back to npm install"
  npm install --include=dev --no-audit --no-fund
fi
