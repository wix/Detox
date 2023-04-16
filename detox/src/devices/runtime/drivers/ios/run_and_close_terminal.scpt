on run argv
  set scriptToRun to (item 1 of argv)
  tell application "Terminal"
    activate
    set newTab to do script scriptToRun
    delay 1
    repeat while (busy of newTab) is true
      delay 1
    end repeat
    close (first window whose tabs contains newTab)
  end tell
end run
