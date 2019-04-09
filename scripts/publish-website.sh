#!/bin/bash -ex


if [ "JENKINS_MASTER" ] ; then
  git config user.email "$GIT_USER@users.noreply.github.com"
  git config user.name "Wix"
  echo "machine github.com login $GIT_USER password $GIT_TOKEN" > ~/.netrc

  cd website
  npm install
  npm run gatherDocs
  GIT_USER=$GIT_USER CURRENT_BRANCH=master npm run publish-gh-pages
else
  echo 'Not deploying the website'
  exit 0;
fi
