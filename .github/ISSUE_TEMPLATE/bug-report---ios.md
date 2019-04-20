---
name: Bug Report - iOS
about: Create a report to help us improve Detox on iOS
title: ''
labels: 'platform: ios, type: triage/bug'
assignees: ''

---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**

- [ ] I have tested this issue on the latest Detox release and it still reproduces

Provide the steps necessary to reproduce the issue. If you are seeing a regression, try to provide the last known version where the issue did not reproduce.

1. 
2. 
3. 
4. 

If possible, please provide a small demo project that reproduces the issue, or attach a video with the reproduction - this would be very appreciated.

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment (please complete the following information):**
 - Detox:
 - React Native:
 - Node:
 - Device:
 - Xcode:
 - iOS:
 - macOS: 

**Device and Verbose Detox Logs**
Provide the device and "trace" Detox logs so we can understand what happened. You can obtain them by passing the loglevel param: `detox test --loglevel trace`

**iOS Framework Build Logs**
If you are seeing a build problem (e.g. during `npm install`), provide the log found here: `~/Library/Detox/ios/{...}/detox_ios.log`
