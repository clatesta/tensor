#!/bin/bash
# source: http://stackoverflow.com/questions/9023164/in-bash-how-can-i-run-multiple-infinitely-running-commands-and-cancel-them-all

# Init
grunt dev
source ./env/bin/activate

grunt watch &
PIDS[0]=$!

python3 run.py &
PIDS[1]=$!

trap "kill ${PIDS[*]} && deactivate; grunt clean" SIGINT

wait