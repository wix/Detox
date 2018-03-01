#!/bin/bash

set -e

BRANCH=$(if [ "$TRAVIS_PULL_REQUEST" == "false" ]; then echo $TRAVIS_BRANCH; else echo $TRAVIS_PULL_REQUEST_BRANCH; fi)

if [[ "$BRANCH" != "master" ]]; then 
  echo 'Not deploying the website because we are not on master'; 
  exit 0; 
fi

git config --global user.email "$GIT_USER@users.noreply.github.com";
git config --global user.name "Wix";
echo "machine github.com login $GIT_USER password $GIT_TOKEN" > ~/.netrc;
cd website;
npm install;
GIT_USER=$GIT_USER CURRENT_BRANCH=master npm run publish-gh-pages;
