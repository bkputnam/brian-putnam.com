#!/usr/bin/env bash
./build_all.sh || { exit -1; }

# Install gcloud from here: https://cloud.google.com/sdk/docs/install
gcloud config set project brian-putnam
gcloud app deploy --quiet
