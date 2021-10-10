---
name: Bug Report - Android
about: Create a report to help us improve Detox on Android
title: ''
labels: 'type: triage/bug, z_platform: android'
assignees: ''

---

### Describe the bug
<!-- A clear and concise description of what the bug is. -->


### Steps To Reproduce

- [ ] I have tested this issue on the latest Detox release and it still reproduces

<!--
Provide the steps necessary to reproduce the issue. If you are seeing a regression, try to provide the last known version where the issue did not reproduce.
-->

1. 
2. 
3. 

<!--
If possible, please provide a small demo project that reproduces the issue, or attach a video with the reproduction - this would be very appreciated.
-->


### Expected behavior
<!-- A clear and concise description of what you think should happen. -->


### Detox Trace-Logs
<!--
Place *Detox* logs under the "details" tag below. They can be obtained by passing the `loglevel` param: `detox test --loglevel trace`.

IMPORTANT: We will not be able to help out or provide proper analysis without these!
-->

<details>
 <summary>Detox logs</summary>
 <code>
 (paste logs here)
 </code>
</details>

### Device logs (adb logcat)
<!--
Paste *device* logs from the Android device/emulator - associated with the failing tests, under the "details" tag below.
Device logs can be obtained either by using `adb` (e.g. by running `adb logcat` while the test is running), or by running having Detox generate them as test artifacts (i.e. by providing the `--record-logs all` argument to the "detox test ..." command - see artifacts guide (https://github.com/wix/Detox/blob/master/docs/APIRef.Artifacts.md) for more info).

IMPORTANT: We will not be able to help out or provide proper analysis without these!
-->

<details>
 <summary>Device logs</summary>
 <code>
 (paste logs here)
 </code>
</details>


### Screenshots / Video

<!-- If applicable, add screenshots and videos to help explain your problem. To learn how to generate those, visit our test artifacts guide: https://github.com/wix/Detox/blob/master/docs/APIRef.Artifacts.md -->


### Environment
<!-- Please provide the following information -->
 - Detox:
 - React Native:
 - Node:
 - Device:
 - OS: 
 - Test-runner (select one): `jest-circus` | `jest-jasmine2` (deprecated) | `mocha`

<!-- Note: Test-runner is set in your detox configuration file (e.g. package.json, detox.config) -->
