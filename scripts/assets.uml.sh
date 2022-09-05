#!/usr/bin/env bash

plantuml docs/uml/**/*.uml
mkdir -p docs/img/uml
mv docs/uml/**/*.png docs/img/uml

