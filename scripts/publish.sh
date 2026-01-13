#!/bin/bash -e

VERSION_TYPE="$1"
if [ -z "$VERSION_TYPE" ]; then
  VERSION_TYPE="patch"
fi

echo "[Publish] VERSION_TYPE=$VERSION_TYPE"
echo ""

echo "[Publish] Bumping version..."
yarn version $VERSION_TYPE

VERSION=$(node -p "require('./package.json').version")

echo "[Publish] Publishing detox@$VERSION..."
cd detox && npm publish && cd ..

echo "[Publish] Publishing detox-cli@$VERSION..."
cd detox-cli && npm publish && cd ..

echo "[Publish] Updating Github..."
git add -A
git commit -m "[skip ci] Publish $VERSION"
git tag "$VERSION"
git push
git push --tags

echo "[Publish] Over and out"
