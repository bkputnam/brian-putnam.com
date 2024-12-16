#!/usr/bin/bash

DEST='../../client/fractograms_rx'

rm -rf $DEST/*
npm run build
cp -r ./dist $DEST
