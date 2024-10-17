#!/usr/bin/env bash

./build_all.sh

cd local/devserver;

# Use node_modules/.package-lock.json as a signal for whether or not npm install
# needs to be run. If it doesn't exist or if it's out of date (older than
# package.json), then run npm install.
if ! test -f node_modules/.package-lock.json || test package.json -nt node_modules/.package-lock.json; then
    echo "node_modules out of date: running npm install";
    npm install;
fi

tsc;
# Add --inspect-brk to next command to debug devserver locally
node src/devserver.js;

