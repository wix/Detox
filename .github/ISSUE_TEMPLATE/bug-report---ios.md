---
name: Bug Report - iOS
about: Create a report to help us improve Detox on iOS
title: ''
labels: 'type: triage/bug, z_platform: ios'
assignees: ''

---

### Description
A clear and concise description of what the bug is.

- [ ] I have tested this issue on the latest Detox release and it still reproduces

#### Reproduction

Provide the steps necessary to reproduce the issue. If you are seeing a regression, try to provide the last known version where the issue did not reproduce.

1. 
2. 
3. 

<!--
IMPORTANT! In case of a vague bug or a crash, please create an example project that reproduces it by forking the ready-to-go DetoxTemplate project (https://github.com/wix-incubator/DetoxTemplate) and applying the minimal changes required for it to reproduce (e.g. add 3rd party libraries / e2e tests). For complete information, review the guidelines there.
-->


#### Expected behavior

<!-- A clear and concise description of what you expected to happen. -->


#### Screenshots / Video

<!-- If applicable, add screenshots and videos to help explain your problem. To learn how to generate those, visit our test artifacts guide: https://github.com/wix/Detox/blob/master/docs/APIRef.Artifacts.md -->


#### Environment
<!-- Please provide the following information -->
 - Detox:
 - React Native:
 - Node:
 - Device:
 - Xcode:
 - iOS:
 - macOS: 
 - Test-runner (select one): `jest-circus` | `jest-jasmine2` (deprecated) | `mocha`

<!-- Note: Test-runner is set in your detox configuration file (e.g. package.json, detox.config) -->

### Logs

#### If you are experiencing a timeout in your test

- [ ] I have followed the instructions under [Identifying which synchronization mechanism causes us to wait too much](https://github.com/wix/Detox/blob/master/docs/Troubleshooting.Synchronization.md#identifying-which-synchronization-mechanism-causes-us-to-wait-too-much), I have read [synchronization debug documentation](https://github.com/wix/DetoxSync/blob/master/IdleStatusDocumentation.md) and am providing the relevant synchronization debug output below:

#### If you are seeing a Detox build problem (e.g. during `npm install`, not `detox build`)

- [ ] I am providing the `npm install` log below:

<details>
 <summary>Npm logs</summary>
 <code>
 (paste logs here)
 </code>
</details>

#### Device and verbose Detox logs

- [ ] I have run my tests using the `--loglevel trace` argument and am providing the verbose log below:

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

<!--
Paste *device* logs from the test device - associated with the failing tests, under the "details" tag below.
Device logs can be obtained by having Detox generate them as test artifacts (i.e. by providing the `--record-logs all` argument to the "detox test ..." command - see artifacts guide (https://github.com/wix/Detox/blob/master/docs/APIRef.Artifacts.md) for more info).

IMPORTANT: We will not be able to help out or provide proper analysis without these!
-->

<details>
 <summary>Device logs</summary>
 <code>
 (paste logs here)
 </code>
</details>
