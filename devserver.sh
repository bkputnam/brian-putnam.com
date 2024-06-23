#!/usr/bin/env bash

./build_all.sh

cd local/devserver;
npm install --silent;
tsc;
# Add --inspect-brk to next command to debug devserver locally
node src/devserver.js;
