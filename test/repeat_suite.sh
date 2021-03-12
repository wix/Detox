#!/bin/bash

echo "Building Detox.framework"
detox clean-framework-cache && detox build-framework-cache &> /dev/null
echo "Building suite"
detox build -c ios.sim.release &> /dev/null
echo "Running tests"
while [ 1 -lt 4 ]
do
	START_DATE=$(date +'%Y-%m-%d %H:%M:%S')
	sleep 1s
	detox test -c ios.sim.release
	RV=${?}
	sleep 1s
	END_DATE=$(date +'%Y-%m-%d %H:%M:%S')
	xcrun simctl spawn booted log show --style syslog --predicate 'subsystem contains "com.wix.Detox"' --start "${START_DATE}" --end "${END_DATE}" > device.log
	
	if [ "$RV" -ne "0" ] ; then
		echo "FAILED!"
		exit -1
	fi
done