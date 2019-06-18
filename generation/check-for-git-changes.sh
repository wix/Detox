#!/bin/bash

set -e

isGitClean=true
if [ -z "$(git status --porcelain)" ]; then
  isGitClean=true
else
  isGitClean=false
fi

if [ "isGitClean" = true ] ; then
    git stash
fi

npm run build

gitDiff=`git --no-pager diff -- .. ":(exclude)../**/package.json"`
if [[ -n "${gitDiff}" ]]; then
    printf "\n\n"
    echo "There seem to be changes after running the code generation."
    echo "This might be because you updated a native dependency and forgot to run the code generation."
    echo "If this is the case run 'cd generation && npm run build'"
    printf "\n"
    echo "Another source of this error might be that you have changed generated code and checked it in."
    echo "You should not be doing this, please change the source of the generated code and not the code itself."
    printf "\n"
    echo "Diff summary:"
    echo "${gitDiff}"

    if [ "isGitClean" = true ] ; then
      git stash pop
    fi
    exit 1
else
    if [ "isGitClean" = true ] ; then
      git stash pop
    fi
fi
