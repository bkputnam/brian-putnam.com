#!/usr/bin/env bash

tsc -p local/devserver/tsconfig.json
node local/devserver/src/devserver.js
