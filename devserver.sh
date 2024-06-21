#!/usr/bin/env bash

./build_all.sh

# This isn't covered by build_all.sh because it isn't deployed to prod
tsc -p local/devserver/tsconfig.json

# Add --inspect-brk to next command to debug devserver locally
node local/devserver/src/devserver.js
