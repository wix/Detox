#!/bin/bash -e

VERSION_TYPE="$1"
if [ -z "$VERSION_TYPE" ]; then
  VERSION_TYPE="patch"
fi

echo "[Publish] VERSION_TYPE=$VERSION_TYPE"
echo ""

echo "[Publish] Starting lerna publish..."
lerna publish --cd-version "$VERSION_TYPE" --yes --skip-git

echo "[Publish] Updating Github..."
git add -A
git commit -m "[skip ci] Publish $VERSION"
git tag "$VERSION"
git push
git push --tags

echo "[Publish] Over and out"
