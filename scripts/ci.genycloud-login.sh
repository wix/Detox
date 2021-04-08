#!/bin/bash -ex

which gmsaas
gmsaas --version
gmsaas auth login "$GENYCLOUD_USERNAME" "$GENYCLOUD_PASSWORD"
