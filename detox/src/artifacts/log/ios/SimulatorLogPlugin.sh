#!/usr/bin/env bash

_kill_tails() {
  pkill -P $$
}

trap _kill_tails SIGTERM SIGINT
tail -F $1 | sed>>$3 -u -e "s/^/stdout: /" &
tail -F $2 | sed>>$3 -u -e "s/^/stderr: /" &
wait