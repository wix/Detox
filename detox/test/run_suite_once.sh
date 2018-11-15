#!/bin/bash

START_DATE=$(date +'%Y-%m-%d %H:%M:%S')
sleep 1s
detox test -c ios.sim.release
sleep 1s
END_DATE=$(date +'%Y-%m-%d %H:%M:%S')
xcrun simctl spawn booted log show --style syslog --predicate 'subsystem contains "com.wix.Detox"' --start "${START_DATE}" --end "${END_DATE}" > device.log