# Submitting Pull Requests

:::note

Before creating a PR, it's recommended to consult with the Detox collaborators. Request a design review or assistance with planning the tests to ensure alignment with project goals.

Contact us on our [Discord Server] or open an [issue on GitHub].

:::

## Fork the Repository

- Fork the repository to your own GitHub account.
- Create a new branch from the `master` branch for your work.

## Test Your Changes

Being a testing framework, Detox is a highly self-tested project. Be sure to add/fix test coverage over your work, by running the various test flavors associated with your changes. You can review them, [here](./building-and-testing).

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
[issue on GitHub]: https://github.com/wix/Detox/issues/new/choose
