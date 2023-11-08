# Submitting Pull Requests

:::note

Before creating a PR, it's recommended to consult with the Detox collaborators. Request a design review or assistance with planning the tests to ensure alignment with project goals.

Contact us on our [Discord Server] or open an issue on GitHub.

:::

## Fork the Repository

- Fork the repository to your own GitHub account.
- Create a new branch from the `master` branch for your work.

## Test Your Changes

- **Unit Testing:** Write unit tests for your code, usually located within the same directory as the unit under test.
- **End-to-End (E2E) Testing:**
  - Our E2E tests are located under the `detox/test/e2e` directory, with each test file named after the feature it tests. These tests are testing a real React Native app (`detox/test`).
  - Running the test can be done using `detox build` and `detox test` commands, as described in the `package.json` of the project.
- After changes to the native implementation of Detox (or `DetoxSync`), rebuild the framework before running the tests locally:

```bash
detox rebuild-framework-cache
```

- **Integration Testing:** Usually, integration tests are not required. If there are special cases, perform integration tests under `detox/test/integration`.

## Modify Documentation

If your changes affect the public API, update the documentation accordingly to reflect your changes.
Refer to the [Documentation Changes] page for guidelines.

## Commit Message Guidelines

Write descriptive, meaningful commit messages that follow the **Conventional Commits** format, specifying the type of change, the scope, and a concise description. For example:

```plaintext
fix(ios): resolve crash on scrolling in iOS 17.0
feat(android): add new API for setting the device locale
test: update unit tests for new utility function
```

More details on good commit messages can be found [here](https://www.conventionalcommits.org/en/v1.0.0/).

## Open the Pull Request

- Fill in the provided PR template fields on GitHub.
- Provide a clear description of your changes and any necessary context.

[Documentation Changes]: ../documentation.md
[Discord Server]: https://discord.gg/CkD5QKheF5
