# Documentation Site

Contributions towards enhancing our documentation are highly valued in the Detox community.
Clear, concise, and comprehensive documentation enables users to understand and utilize the project more effectively.

We appreciate all contributions, from correcting typos to creating new documentation pages.

## Getting Started

Our [documentation website](https://wix.github.io/Detox) is developed using [Docusaurus](https://docusaurus.io/). To set up a local version of the website for editing, follow these steps:

```bash npm2yarn
cd website
npm install
npm start
```

## Making Updates

To modify an existing page, find the associated markdown file in the `docs/` directory and make the required changes. To introduce a new page, create a markdown file in `docs/` and link to it in `website/sidebars.json`.

## Deploying Changes

Automatic updates to the website occur with each commit to the `master` branch, with these changes reflected under the `Next` version. The process of tagging and locking documentation to a specific version is automated and coincides with each Detox release.

If there's a need to update the documentation of a particular version, modify the associated files and code located under `website/versioned_docs/version-<version>/` and `website/versioned_sidebars/version-<version>-sidebars.json`.

## Modifying Old Versions

To update an older version with the latest changes:

1. Remove the desired version from `versions.json`.
1. Execute `npm run docusaurus docs:version <version>`.

## Reviewing Style Modifications

If you're making changes to the stylesheets, use this [demo page](../demo.mdx) to visually inspect the impact of your changes and avoid unintentional visual regressions.
