/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const CompLibrary = require('../../core/CompLibrary');
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

const CWD = process.cwd();

const siteConfig = require(CWD + '/siteConfig.js');
const versions = require(CWD + '/versions.json');
const githubReleaseUrl = version => `https://github.com/wix/detox/releases/tag/${version}`;
const documentationTarget = "Introduction.GettingStarted.html"

function VersionLinks({version, isLatest = false}) {
  const expandedVersion = version.replace('.X', '.0.0')
  const isMaster = version === "master";
  
  const docIdentifier = isMaster ? "next/" : (isLatest ? "" : version + "/");

  return (
    <tr key={version}>
      <th>{version}</th>
      <td>
        <a href={`docs/${docIdentifier}${documentationTarget}`}>Documentation</a>
      </td>
      <td>
        <a href={isMaster ? "https://github.com/wix/detox" : githubReleaseUrl(expandedVersion)}>Release Notes</a>
      </td>
    </tr>
  )
}

class Versions extends React.Component {
  render() {
    const latestVersion = versions[0];
    return (
      <div className="docMainWrapper wrapper">
        <Container className="mainContainer versionsContainer">
          <div className="post">
            <header className="postHeader">
              <h2>{siteConfig.title + ' Versions'}</h2>
            </header>
            <a name="latest" />
            <h3>Current version (Stable)</h3>
            <table className="versions">
              <tbody>
                <VersionLinks version={latestVersion} isLatest />
              </tbody>
            </table>
            <p>
              This is the version that is configured automatically when you
              first install this project.
            </p>
            <a name="rc" />
            <h3>Pre-release versions</h3>
            <table className="versions">
              <tbody>
                <VersionLinks version="master" />
              </tbody>
            </table>
            <p>Other text describing this section.</p>
            <a name="archive" />
            <h3>Past Versions</h3>
            <table className="versions">
              <tbody>
                {versions
                  .filter(version => version !== latestVersion)
                  .map(version => <VersionLinks version={version} />)
                }
              </tbody>
            </table>
            <p>
              You can find past versions of this project{' '}
              <a href="https://github.com/wix/detox/releases"> on GitHub </a>.
            </p>
          </div>
        </Container>
      </div>
    );
  }
}

module.exports = Versions;
