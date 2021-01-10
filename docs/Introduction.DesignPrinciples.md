# Design Principles

Traditionally, end-to-end tests on mobile are riddled with inherent issues, making the testing process difficult and lowering ROI for developers. We believe that the only way to solve these issues at the core is by changing some of the basic principles of our approach.

* **Detox does not rely on WebDriver**—Detox is built from the ground up to integrate with native layers of your mobile app directly. We try to avoid generic cross-platform interfaces that are often the lowest common denominator. We want to optimize per platform

* **Detox does gray box, not black box** — Theoretically, it sounds better to test exactly what you ship as a black box. In practice, switching to gray box allows the test framework to monitor the app from the inside and delivers critical wins like fighting flakiness at the core

* **Detox synchronizes with your app's activity** — By being aware of what your app is doing and synchronizing with it, Detox times its actions, by default, to run only when your app is idle, meaning it has determined that your app has finished its work, such as animations, network requests, React Native load, etc. You can further read on this [here](https://github.com/wix/Detox/blob/master/docs/Troubleshooting.Synchronization.md)

* **Built from the ground up for mobile apps, has first-class React Native support** — Detox is built from the ground up for native mobile and has a first-class support for React Native apps

* **Expectations run on the app, not the tester process** — Traditionally, test frameworks evaluate expectations in the test script, running on Node.js. Detox evaluates expectations directly in the tested app, running on device; this enables operations that were impossible before due to performance reasons

