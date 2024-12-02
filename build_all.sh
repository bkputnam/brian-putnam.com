#!/usr/bin/env bash

echoRun () {
    cmd=$1
    echo $cmd
    (eval $cmd) || { exit -1; }
}

originalDir=$(pwd)
for dir in ./client/*/; do
    if [ -f $dir/package.json ]; then
        cd $dir;
        echoRun "npm install"
        cd $originalDir;
    fi
    if [ -f $dir/tsconfig.json ]; then
        echoRun "tsc -p ${dir}";
    fi
done
