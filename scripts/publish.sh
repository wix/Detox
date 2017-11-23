#!/bin/bash -e

VERSION_TYPE="$1"
if [ -z "$VERSION_TYPE" ]; then
	VERSION_TYPE="patch"
fi

lerna publish --cd-version "$VERSION_TYPE" --yes --skip-git
VERSION=`node -p "require('./detox/package.json').version"`
github_changelog_generator --future-release "$VERSION" --no-verbose
git add -A
git commit -m "[skip ci] Publish $VERSION"
git tag "$VERSION"
git push
git push --tags