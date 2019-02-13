#!/bin/bash -e

if [ -z "$CHANGELOG_GITHUB_TOKEN" ]; then
	echo "Please provide a github token for the change-log generator (i.e. set CHANGELOG_GITHUB_TOKEN). See https://github.com/github-changelog-generator/github-changelog-generator#github-token for more details."
	exit 1
fi

VERSION_TYPE="$1"
if [ -z "$VERSION_TYPE" ]; then
	VERSION_TYPE="patch"
fi

echo "[Publish] CHANGELOG_GITHUB_TOKEN=$CHANGELOG_GITHUB_TOKEN"
echo "[Publish] VERSION_TYPE=$VERSION_TYPE"
echo ""

echo "[Publish] Starting lerna publish..."
lerna publish --cd-version "$VERSION_TYPE" --yes --skip-git

echo "[Publish] Running change-log generator..."
VERSION=`node -p "require('./detox/package.json').version"`
github_changelog_generator --future-release "$VERSION" --no-verbose

echo "[Publish] Updating Github..."
git add -A
git commit -m "[skip ci] Publish $VERSION"
git tag "$VERSION"
git push
git push --tags

echo "[Publish] Over and out"
