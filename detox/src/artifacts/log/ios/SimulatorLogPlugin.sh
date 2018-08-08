#!/usr/bin/env bash

_kill_tails() {
  pkill -P $$
}

trap _kill_tails SIGTERM SIGINT

case "$(uname -s)" in
   Darwin)
     tail -F $1 | awk>>$3 '{print "stdout:",$0;fflush(stdout)}' &
     tail -F $2 | awk>>$3 '{print "stderr:",$0;fflush(stdout)}' &
     wait
     ;;
   *)
     tail -F $1 | sed>>$3 -u -e "s/^/stdout: /" &
     tail -F $2 | sed>>$3 -u -e "s/^/stderr: /" &
     wait
     ;;
esac
