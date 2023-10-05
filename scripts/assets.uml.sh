#!/usr/bin/env bash

plantuml -tsvg docs/uml/**/*.uml
mkdir -p docs/img/uml
mv docs/uml/**/*.svg docs/img/uml

