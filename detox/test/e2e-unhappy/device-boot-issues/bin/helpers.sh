function has_arg() {
  local THAT_ARG=

  for i do
    if [ -z "$THAT_ARG" ]; then
      THAT_ARG=$i
    else
      if [[ "$i" == "$THAT_ARG" ]] ; then
        return 0
      fi
    fi
  done

  return 1
}

function simulate_error() {
  echo "Simulating an error, exiting with code = 1"
  return 1
}
