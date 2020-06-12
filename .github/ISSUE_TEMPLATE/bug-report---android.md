---
name: Bug Report - Android
about: Create a report to help us improve Detox on Android
title: ''
labels: 'type: triage/bug, z_platform: android'
assignees: ''

---

**Describe the bug**
<!-- A clear and concise description of what the bug is. -->

**To Reproduce**

- [ ] I have tested this issue on the latest Detox release and it still reproduces

<!--
Provide the steps necessary to reproduce the issue. If you are seeing a regression, try to provide the last known version where the issue did not reproduce.
-->

Steps to reproduce:
1. 
2. 
3. 

<!--
If possible, please provide a small demo project that reproduces the issue, or attach a video with the reproduction - this would be very appreciated.
-->

**Expected behavior**
<!-- A clear and concise description of what you think should happen. -->

**Screenshots**
<!-- If applicable, add screenshots to help explain your problem. -->

**Device and Verbose Detox Logs**
<!--
Provide the device and verbose Detox logs so we can understand what happened.
Detox logs can be obtained by passing the loglevel param: `detox test --loglevel trace`.
Device logs can be retrieved from the device using `adb logcat`, or if recorded, Detox' artifacts.
-->

**Environment (please complete the following information):**
 - Detox:
 - React Native:
 - Node:
 - Device:
 - OS: 
 - Test-runner (select one): `jest-circus` | `jest-jasmine2` (deprecated) | `mocha`

<!-- Note: Test-runner is set in Detox.test-runner in your package.json -->
