#!/usr/bin/env bash
./build_all.sh

gcloud config set project brian-putnam
gcloud app deploy --quiet
