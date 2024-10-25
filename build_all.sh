#!/usr/bin/env bash

for dir in ./client/*/; do
    if [ -f $dir/tsconfig.json ]; then
        cmd="tsc -p ${dir}"
        echo $cmd
        eval $cmd || { exit -1; }
    fi
    # $($cmd)
done
