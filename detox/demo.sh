#!/usr/bin/env bash

function print_process_hierarchy {
  local pid=$1
  local indent=$2
  while [ -n "$pid" ] && [ "$pid" -ne 0 ]; do
    local process_info=$(ps -o pid,ppid,args -p $pid | sed -n '2p')
    local parent_pid=$(echo $process_info | awk '{print $2}')
    echo "$indent$process_info"
    pid=$parent_pid
    indent="  $indent"
  done
}

function handler {
  echo -e "\nDemo stopped with code $1 and signal $2\n"
  exit 0
}

trap 'handler $? SIGINT' SIGINT
trap 'handler $? SIGTERM' SIGTERM
trap 'handler $? EXIT' EXIT

echo "Demo started $(date)"
print_process_hierarchy $$

while true; do
  echo "Still running $(date)"
  sleep 1
done
