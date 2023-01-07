#!/usr/bin/env bash

SCRIPT_DIR=$(dirname "$0")
cd $SCRIPT_DIR/www
python3 -m http.server 8080
