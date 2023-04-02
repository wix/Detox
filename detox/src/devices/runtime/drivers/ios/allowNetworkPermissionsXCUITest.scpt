tell application "System Events"
    set frontmost of process "UserNotificationCenter" to true
    tell process "UserNotificationCenter"
        repeat until (exists button "Allow" of window 1)
            delay 1
        end repeat

        repeat while exists button "Allow" of window 1
            if exists button "Allow" of window 1 then
                click button "Allow" of window 1
            end if
        end repeat
    end tell
end tell
