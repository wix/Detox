---
sidebar_label: Overview
---

# Code Changes Overview

Welcome to the code changes section! As a contributor, it's essential to understand the project's goals and adhere to its code of conduct. Before contributing, please review any existing issues related to your work, ensure your code is well-documented, and has adequate test coverage. It's also important that your code is compatible with the project's supported platforms and their versions.

Our collaborative workflow is simple:

1. **Identify an Issue:** If not exists already, create an issue for new features or bug reports, outlining your proposal or the identified problem.
2. **Propose a Solution:** Open a pull request with a proposed solution to the issue. On complex issues, it's recommended to discuss your approach with the community and maintainers before submitting a PR.
3. **Engage in Review:** A collaborator will review your pull request. Reviews from other contributors are also encouraged.
4. **Merge and Release:** After the review, a collaborator will merge your contribution, typically releasing it in the next version of the project.

We use [GitHub] for managing pull requests, conducting code reviews, and tracking issues.

The code review process is central to our collaboration. Every contribution must go through a review before merging to maintain the quality of our codebase. As a contributor, being willing to discuss your work, respond to feedback, and work with the community is key to improving the project and creating a positive environment for all contributors.

## Repository Structure

Our GitHub repository is a monorepo, which means it contains multiple Detox-related projects and packages.

The main package is the Detox framework, which is the core of the project.
It contains the native code for iOS and Android, as well as the JavaScript code.
The other projects are the Detox CLI, the Detox test app, example apps, and the Detox documentation website.

Here's a high-level overview of the repository structure:

- 📁 **detox-cli** - The CLI for Detox (e.g., `detox init`, `detox test`, read more about our [CLI docs])
- 📁 **detox** - The Detox framework
  - 📁 **android** - The Android native code, alongside native unit tests
  - 📁 **ios** - The iOS native code, including its native submodules (e.g., DetoxSync)
  - 📁 **test** - The Detox self-test app: A full-feature React Native app for end-to-end testing Detox itself
    - 📁 **src** - The app's JavaScript code
    - 📁 **e2e** - The Detox self-tests
    - 📁 **integration** - Detox integration self-tests
  - 📁 **local-cli** - Local CLI commands for Detox development (e.g., `detox rebuild-framework-cache`, which rebuilds the iOS framework)
  - 📁 **runners** - The Detox runners, which are used to run the tests
  - 📁 **scripts** - Scripts for building the framework for publishing
  - 📁 **src** - The JavaScript source code of Detox. The include bundled JavaScript unit tests
- 📁 **website** - The documentation website of Detox (read more about our [documentation site docs])
- 📁 **docs** - The documentation of Detox, written in Markdown and published on the website
- 📁 **examples** - Example apps for Detox (for more information, check the [list of example projects])
- 📁 **scripts** - Scripts for building and testing Detox

[GitHub]: https://github.com/wix/Detox
[documentation site docs]: ../documentation.md
[list of example projects]: ./example-projects.md
[CLI docs]: ../../cli/overview.md
