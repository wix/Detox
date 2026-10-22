# Releasing Detox

The [Release workflow](https://github.com/wix/Detox/actions/workflows/release.yml) is the only supported npm publisher.
Repository admins start it manually on `master`.
Releases and snapshots publish `detox` and `detox-cli` with npm trusted publishing (GitHub OIDC); there is no npm token.
Buildkite runs native end-to-end tests and no longer versions or publishes packages.

The tooling is adapted from the React Native Navigation release workflow.
Detox-specific policy lives in `detox.cjs`, so the two copies can later be compared and shared.

## Flow

1. **Prepare** (`macos-15`): checks that the actor is an admin, plans the version, and requires a full Buildkite build that passed on the exact source commit.
   The `buildkite/detox` GitHub status only locates that build; its public Buildkite record must show `passed`, the same commit, and neither a partial `debug` build nor a legacy `release` build.
   Then it installs locked dependencies, sets the version in the root, `detox` and `detox-cli` manifests, refreshes the `<major>.x` docs snapshot (stable releases only), and runs lint and unit tests.
   Finally, it builds `Detox-ios-*.tbz` and `Detox-android/`, creates a local release commit, packs both tarballs, validates their contents, and uploads everything as one artifact.
   A dry run stops here.
2. **Record**: pushes the release commit to `ci/update-version-<version>`.
3. **Publish** (`ubuntu-24.04`, `id-token: write`): publishes the saved tarballs in order, without installing or rebuilding anything.
4. **Finalize**: verifies registry integrity, tags the source commit with the bare version, creates a GitHub release with notes generated from conventional commits (`feat` and `fix` only, grouped by `ios`/`android` scope), and opens the version PR labeled `release`.

Snapshots skip steps 2 and 4: they get a `<base>-snapshot.gha.<run_id>` version and the `snapshot` dist-tag only.

## One-time configuration

1. Create the GitHub environment `npm-release`, restricted to the `master` branch.
2. For **each** of `detox` and `detox-cli`, add an npm trusted publisher: organization `wix`, repository `Detox`, workflow `release.yml`, environment `npm-release`, direct `npm publish` allowed.
3. Allow workflow-created pull requests, and make sure repository rules let GitHub Actions create `ci/update-version-*` branches and version tags.
   The active incident rules from 2026-10-04 (one for branches, one for tags) currently block both, which would fail a release after npm publication.
4. Run a dry run and inspect its artifact.
   Then set the repository variable `RELEASE_PUBLISH_ENABLED=true`.
5. Publish a snapshot and check the version, provenance, and that `latest` did not move.
6. Remove the Buildkite release-only `NPM_TOKEN`, `NPM_EMAIL`, `GIT_TOKEN` injection, and restrict token publishing on npm.

## Start a release

Open **Actions → Release → Run workflow** on `master`:

| Input           | Meaning                                                           |
| --------------- | ----------------------------------------------------------------- |
| `operation`     | `dry-run` (default), `publish`, or `resume`                       |
| `kind`          | `release` or `snapshot`                                           |
| `version`       | Exact semver for releases; empty for snapshots                    |
| `npm_tag`       | `latest` for stable; `next`, `rc`, `alpha` for prereleases        |
| `source_run_id` | Original publishing run ID, for resume only                       |

Examples: `version=20.52.0, npm_tag=latest`; `version=21.0.0-rc.12, npm_tag=rc`; `kind=snapshot, npm_tag=snapshot`.
A release must be newer than npm `latest` and must not move its dist-tag backward.

Review and merge the version PR afterwards.
GitHub does not start workflows for PRs created by `GITHUB_TOKEN`.
Merging the PR deploys the refreshed documentation through the Website workflow.

## Resume a partial release

Use **Re-run failed jobs** on the original run, or dispatch `operation=resume` with `source_run_id`.
Resume reuses the saved tarballs, so a package already on npm with the same integrity is skipped, and a conflicting one stops the run.
Never retry with a different version.
Artifacts are kept for 90 days.

## Validate changes to the release tooling

```sh
node --test scripts/release/*.test.cjs
```

The `Release prepare check` workflow runs on pull requests that touch release or native build files.
It uses the same build steps as the Release workflow (`.github/actions/build-release-packages`) under a throwaway version, then packs and validates both tarballs and uploads them for 3 days.
It publishes nothing and does not check authorization, native CI or the release commit; a Release dry run on `master` covers those.
